import { Directory, File, FileMode, Paths } from 'expo-file-system';
import { EXTENSION_BY_MIME, knownExtension, mimeOfExtension, type FileKind } from '@/utils/file-types';
import type { TaskAttachment, TaskWriteContext } from '@/utils/task-detail';
import { ApiError, type ApiErrorCode } from './http-client';
import type { AccessTokenProvider } from './bff-api';

/*
 * Why file names matter: Quick Look (iOS) and Android viewers pick the viewer from the file *extension*
 * (Android also from the MIME type). SAP list metadata often has names without an extension and a generic
 * `application/octet-stream`, so naming the file from that metadata made every file "not previewable".
 * The BFF already fixes this (magic-byte detection + `Content-Disposition` with the corrected name), so
 * files are downloaded into a folder and keep the server's name; the same detection runs here as a
 * fallback when a name still has no known extension.
 */

/** Downloaded attachments live in the app cache (the OS may purge it) and are deleted on sign-out. */
const ATTACHMENT_DIR = 'attachments';

/** Bytes read to recognize a file (Office files need a look into the ZIP directory). */
const SNIFF_BYTES = 4096;

/** File type from its first bytes (same rules as the BFF's detectMimeFromBuffer), or null. */
export function sniffFileKind(bytes: Uint8Array): FileKind | null {
    if (bytes.length < 4) return null;
    const startsWith = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
    const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

    if (startsWith(0x25, 0x50, 0x44, 0x46)) return { extension: 'pdf', mimeType: 'application/pdf' };
    if (startsWith(0x89, 0x50, 0x4e, 0x47)) return { extension: 'png', mimeType: 'image/png' };
    if (startsWith(0xff, 0xd8, 0xff)) return { extension: 'jpg', mimeType: 'image/jpeg' };
    if (startsWith(0x47, 0x49, 0x46, 0x38)) return { extension: 'gif', mimeType: 'image/gif' };
    if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { extension: 'webp', mimeType: 'image/webp' };
    if (startsWith(0x50, 0x4b, 0x03, 0x04)) {
        let directory = '';
        for (let index = 0; index < Math.min(bytes.length, SNIFF_BYTES); index++) directory += String.fromCharCode(bytes[index]);
        if (/xl[/\\]/.test(directory)) return { extension: 'xlsx', mimeType: mimeOfExtension('xlsx') };
        if (/word[/\\]/.test(directory)) return { extension: 'docx', mimeType: mimeOfExtension('docx') };
        if (/ppt[/\\]/.test(directory)) return { extension: 'pptx', mimeType: mimeOfExtension('pptx') };
        return { extension: 'zip', mimeType: 'application/zip' };
    }
    return null;
}


/** `/tasks/attachments/<id>/content?…`: the BFF streams the file; document id and type spare it a detail lookup. */
export function attachmentPath(attachment: Pick<TaskAttachment, 'id'>, context: Pick<TaskWriteContext, 'documentId' | 'businessObjectType' | 'sapOrigin'>): string {
    const query = [
        ['disposition', 'attachment'],
        ['documentId', context.documentId],
        ['objectType', context.businessObjectType],
        ['sapOrigin', context.sapOrigin],
    ]
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    return `/tasks/attachments/${encodeURIComponent(attachment.id)}/content?${query}`;
}

/** A file-system-safe version of a name (no path separators or control characters). */
export function safeFileName(fileName: string): string {
    return fileName.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim().slice(0, 120) || 'attachment';
}

/** Folder per attachment id: two attachments with the same name never overwrite each other. */
function folderOf(attachmentId: string): Directory {
    return new Directory(Paths.cache, ATTACHMENT_DIR, attachmentId.replace(/[^\w.-]+/g, '_') || 'file');
}

/** HTTP status inside a download error message ("… status code 401 …"), if any. */
export function statusOfDownloadError(error: unknown): number | undefined {
    const message = error instanceof Error ? error.message : String(error);
    const match = /\b([1-5]\d{2})\b/.exec(message);
    return match ? Number(match[1]) : undefined;
}

function toApiError(error: unknown, path: string): ApiError {
    if (error instanceof ApiError) return error;
    const status = statusOfDownloadError(error);
    const message = error instanceof Error ? error.message : String(error);
    const code: ApiErrorCode = status === 401 ? 'UNAUTHORIZED' : status ? 'HTTP_ERROR' : 'NETWORK_ERROR';
    return new ApiError(message, code, status ?? 0, undefined, path.split('?')[0]);
}

function readHead(file: File): Uint8Array {
    const handle = file.open(FileMode.ReadOnly);
    try {
        return handle.readBytesSync(SNIFF_BYTES);
    } finally {
        handle.close();
    }
}

/**
 * Makes sure the downloaded file has an extension the OS viewers understand: the server's name first, then
 * the file's own bytes, then the list metadata. Returns the file (renamed if needed) and its MIME type.
 */
function withKnownExtension(file: File, attachment: TaskAttachment): { file: File; kind: FileKind | null } {
    const current = knownExtension(file.name);
    if (current) return { file, kind: { extension: current, mimeType: mimeOfExtension(current) } };

    let kind: FileKind | null = null;
    try {
        kind = sniffFileKind(readHead(file));
    } catch {
        kind = null;
    }
    if (!kind) {
        const fromMetadata = knownExtension(attachment.fileName) || EXTENSION_BY_MIME[attachment.mimeType.toLowerCase()];
        kind = fromMetadata ? { extension: fromMetadata, mimeType: mimeOfExtension(fromMetadata) } : null;
    }
    if (kind) file.rename(`${safeFileName(file.name.replace(/\.+$/, ''))}.${kind.extension}`);
    return { file, kind };
}

/** The cached download of an attachment (one non-empty file in its folder), if any. */
function cachedFile(folder: Directory): File | null {
    if (!folder.exists) return null;
    const file = folder.list().find((entry): entry is File => entry instanceof File && (entry.size ?? 0) > 0);
    return file ?? null;
}

export interface DownloadedAttachment {
    file: File;
    /** Detected MIME type, or undefined when the type is unknown. */
    mimeType?: string;
}

/**
 * Downloads an attachment once (later opens reuse the cached copy) with the user's token. A 401 is retried
 * once with a refreshed token, like every other BFF call.
 */
export async function downloadAttachment(baseUrl: string, getAccessToken: AccessTokenProvider, attachment: TaskAttachment, context: TaskWriteContext): Promise<DownloadedAttachment> {
    const folder = folderOf(attachment.id);
    const cached = cachedFile(folder);
    if (cached) {
        const { file, kind } = withKnownExtension(cached, attachment);
        return { file, mimeType: kind?.mimeType };
    }

    const path = attachmentPath(attachment, context);
    // A folder as destination: the file keeps the name the BFF sends in Content-Disposition (with the
    // extension it detected from the content). Leftovers of a failed download are cleared first.
    if (folder.exists) folder.delete();
    folder.create({ intermediates: true });
    const download = (token: string) => File.downloadFileAsync(`${baseUrl}${path}`, folder, { headers: { Authorization: `Bearer ${token}` }, idempotent: true });

    const token = await getAccessToken();
    if (!token) throw new ApiError('Not signed in', 'UNAUTHORIZED', 401);
    let downloaded: File;
    try {
        downloaded = await download(token);
    } catch (error) {
        if (statusOfDownloadError(error) !== 401) throw toApiError(error, path);
        const refreshed = await getAccessToken({ forceRefresh: true, rejectedToken: token });
        if (!refreshed) throw toApiError(error, path);
        try {
            downloaded = await download(refreshed);
        } catch (retryError) {
            throw toApiError(retryError, path);
        }
    }
    const { file, kind } = withKnownExtension(downloaded, attachment);
    return { file, mimeType: kind?.mimeType };
}

/** Removes every downloaded attachment (sign-out: documents must not outlive the session). */
export function clearDownloadedAttachments(): void {
    try {
        const folder = new Directory(Paths.cache, ATTACHMENT_DIR);
        if (folder.exists) folder.delete();
    } catch {
        // Best effort: the OS purges the cache folder on its own as well.
    }
}

/** Whether `uri` points inside `folderUri` (no `..` segments, no other scheme or folder). Pure: unit-tested. */
export function isInsideFolder(uri: string, folderUri: string): boolean {
    if (!uri || !folderUri) return false;
    const folder = folderUri.endsWith('/') ? folderUri : `${folderUri}/`;
    let decoded: string;
    try {
        decoded = decodeURIComponent(uri);
    } catch {
        return false;
    }
    return uri.startsWith(folder) && !decoded.split('/').includes('..');
}

/** True only for files this app downloaded as attachments (guards the image viewer route). */
export function isDownloadedAttachmentUri(uri: string): boolean {
    return isInsideFolder(uri, new Directory(Paths.cache, ATTACHMENT_DIR).uri);
}
