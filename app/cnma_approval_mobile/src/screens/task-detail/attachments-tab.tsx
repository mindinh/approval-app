import { friendlyFileType } from '@approval-core/file-names';
import type { SymbolViewProps } from 'expo-symbols';
import { Fragment } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { RowSeparator, Section } from '@/components/section';
import { ThemedText } from '@/components/themed-text';
import { radius, spacing, useColors } from '@/theme';
import { formatDate, formatFileSize } from '@/utils/format';
import { useOpenAttachment } from '@/hooks/use-open-attachment';
import type { TaskAttachment, TaskWriteContext } from '@/utils/task-detail';

const ICON_TILE = 40;
/** Separator inset aligned with the file name (padding 16 + tile 40 + gap 12). */
const TEXT_INSET = 68;

function fileIcon(mimeType: string, fileName: string): SymbolViewProps['name'] {
    const name = fileName.toLowerCase();
    if (mimeType.startsWith('image/')) return { ios: 'photo', android: 'image' };
    if (mimeType === 'application/pdf' || name.endsWith('.pdf')) return { ios: 'doc.richtext', android: 'picture_as_pdf' };
    if (/sheet|excel|csv/.test(mimeType) || /\.(xlsx?|csv)$/.test(name)) return { ios: 'tablecells', android: 'table_chart' };
    if (/zip|rar|7z/.test(mimeType)) return { ios: 'doc.zipper', android: 'folder_zip' };
    return { ios: 'doc', android: 'description' };
}

/**
 * Attachment list like the web panel: name, file type · size, then "By uploader • date". Tapping a row opens
 * the file in the system viewer; the trailing button shares or saves it (Files, Mail, Drive…).
 */
export function AttachmentsTab({ attachments, context }: { attachments: readonly TaskAttachment[]; context: TaskWriteContext }) {
    const colors = useColors();
    const { busyId, open, share } = useOpenAttachment(context);
    if (attachments.length === 0) {
        return <EmptyState icon={{ ios: 'paperclip', android: 'attach_file' }} tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }} title="No attachments" />;
    }

    return (
        <Section>
            {attachments.map((attachment, index) => {
                const meta = [friendlyFileType(attachment.mimeType, attachment.fileName), attachment.fileSize ? formatFileSize(attachment.fileSize) : ''].filter(Boolean).join(' · ');
                const byline = [attachment.createdBy ? `By ${attachment.createdBy}` : '', formatDate(attachment.createdAt)].filter(Boolean).join(' • ');
                return (
                    <Fragment key={attachment.id}>
                        {index > 0 ? <RowSeparator inset={TEXT_INSET} /> : null}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={[attachment.fileName, meta].filter(Boolean).join(', ')}
                            accessibilityHint="Opens the file"
                            accessibilityState={{ busy: busyId === attachment.id }}
                            onPress={() => void open(attachment)}
                            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.smd, padding: spacing.md, backgroundColor: pressed ? colors.fillBackground : 'transparent' })}
                        >
                            <View style={{ width: ICON_TILE, alignItems: 'center' }}>
                                <Icon name={fileIcon(attachment.mimeType, attachment.fileName)} size={22} color={colors.secondaryLabel} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <ThemedText variant="subhead" numberOfLines={2} style={{ color: colors.label, fontWeight: '500' }}>
                                    {attachment.fileName}
                                </ThemedText>
                                {meta ? (
                                    <ThemedText variant="caption" numberOfLines={1}>
                                        {meta}
                                    </ThemedText>
                                ) : null}
                                {byline ? (
                                    <ThemedText variant="caption" numberOfLines={1} style={{ color: colors.tertiaryLabel }}>
                                        {byline}
                                    </ThemedText>
                                ) : null}
                            </View>
                            {busyId === attachment.id ? (
                                <ActivityIndicator color={colors.accent} style={{ width: 36 }} />
                            ) : (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Share ${attachment.fileName}`}
                                    hitSlop={8}
                                    disabled={busyId !== null}
                                    onPress={() => void share(attachment)}
                                    style={({ pressed }) => ({ width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.fillBackground : 'transparent' })}
                                >
                                    <Icon name={{ ios: 'square.and.arrow.up', android: 'share' }} size={18} color={colors.secondaryLabel} />
                                </Pressable>
                            )}
                        </Pressable>
                    </Fragment>
                );
            })}
        </Section>
    );
}
