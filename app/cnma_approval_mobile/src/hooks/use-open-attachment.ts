import type { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { downloadAttachment } from '@/lib/api/attachments';
import { useSession } from '@/lib/auth/session';
import { config } from '@/lib/config/env';
import { haptics } from '@/lib/haptics';
import { describeError } from '@/utils/app-error';
import { isViewerImage } from '@/utils/file-types';
import type { TaskAttachment, TaskWriteContext } from '@/utils/task-detail';

/** System share sheet (Save to Files, Mail, Drive, other viewer apps). */
async function shareFile(file: File, title: string, mimeType: string | undefined): Promise<void> {
    if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing is not available', 'This device cannot share files.');
        return;
    }
    // iOS reads the type from the extension (a MIME type there would rename the file); Android needs it on the intent.
    await Sharing.shareAsync(file.uri, { mimeType: Platform.OS === 'android' ? mimeType : undefined, dialogTitle: title });
}

/**
 * Opens a task attachment: images in the in-app viewer, other files in the platform viewer (Quick Look on
 * iOS for PDF, Office, text…; the
 * matching viewer app on Android). A file no viewer understands gets a short explanation with an
 * "Open in…" choice instead of a silent share sheet; the trailing share button always shares. One
 * attachment at a time: repeated taps while it downloads are ignored.
 */
export function useOpenAttachment(context: TaskWriteContext) {
    const { getAccessToken } = useSession();
    const router = useRouter();
    const [busyId, setBusyId] = useState<string | null>(null);
    const busy = useRef(false);

    const run = async (attachment: TaskAttachment, action: 'open' | 'share') => {
        if (busy.current || !config) return;
        busy.current = true;
        setBusyId(attachment.id);
        haptics.light();
        try {
            const { file, mimeType } = await downloadAttachment(config.apiBaseUrl, getAccessToken, attachment, context);
            if (action === 'share') {
                await shareFile(file, attachment.fileName, mimeType);
                return;
            }
            // Images: the in-app viewer (Quick Look hides Close on images until the user taps).
            if (isViewerImage(file.extension.replace('.', ''))) {
                router.push({ pathname: '/attachment-viewer', params: { uri: file.uri, title: attachment.fileName } });
                return;
            }
            if (await file.canPreview({ mimeType })) {
                await file.preview({ title: attachment.fileName, mimeType });
                return;
            }
            const extension = file.extension ? ` (${file.extension.replace('.', '').toUpperCase()})` : '';
            Alert.alert('Cannot preview this file', `This file type${extension} cannot be shown in the app. You can open it in another app or save it to Files.`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open in…', onPress: () => void shareFile(file, attachment.fileName, mimeType) },
            ]);
        } catch (error) {
            haptics.error();
            const info = describeError(error, `Opening attachment ${attachment.fileName}`);
            Alert.alert(info.title, info.message);
        } finally {
            busy.current = false;
            setBusyId(null);
        }
    };

    return { busyId, open: (attachment: TaskAttachment) => run(attachment, 'open'), share: (attachment: TaskAttachment) => run(attachment, 'share') };
}

