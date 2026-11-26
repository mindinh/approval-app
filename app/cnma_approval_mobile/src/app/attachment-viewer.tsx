import { useLocalSearchParams } from 'expo-router';
import { isDownloadedAttachmentUri } from '@/lib/api/attachments';
import { AttachmentViewerScreen } from '@/screens/attachment-viewer';
import { firstParam } from '@/utils/route-params';

/**
 * In-app image viewer. Only files the app itself downloaded (cache/attachments) are shown, so a crafted
 * deep link (cnmaapproval://attachment-viewer?uri=…) cannot open any other file.
 */
export default function AttachmentViewerRoute() {
    const params = useLocalSearchParams<{ uri?: string; title?: string }>();
    const uri = firstParam(params.uri);
    return <AttachmentViewerScreen uri={isDownloadedAttachmentUri(uri) ? uri : null} title={firstParam(params.title) || 'Attachment'} />;
}
