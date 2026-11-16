import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import type { ApiResult } from '@/lib/api/http-client';
import { radius, spacing, type ThemeColors, useColors } from '@/theme';
import type { ConnectionCheck } from './checks';

const MAX_PREVIEW_CHARS = 4000;
const STATUS_SIZE = 32;

function preview(result: ApiResult): string {
    const body = result.ok ? result.data : (result.error ?? result.data);
    const text = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    if (!text) return '(empty response)';
    return text.length > MAX_PREVIEW_CHARS ? `${text.slice(0, MAX_PREVIEW_CHARS)}\n… (${text.length - MAX_PREVIEW_CHARS} more characters)` : text;
}

function StatusBadge({ result, running, colors }: { result?: ApiResult; running: boolean; colors: ThemeColors }) {
    const background = running || !result ? colors.fillBackground : result.ok ? colors.successSoft : colors.dangerSoft;
    return (
        <View style={{ width: STATUS_SIZE, height: STATUS_SIZE, borderRadius: radius.full, backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}>
            {running ? (
                <ActivityIndicator size="small" />
            ) : result ? (
                <Icon name={result.ok ? { ios: 'checkmark', android: 'check_circle' } : { ios: 'xmark', android: 'error' }} size={16} color={result.ok ? colors.success : colors.danger} />
            ) : (
                <Icon name={{ ios: 'play.fill', android: 'play_arrow' }} size={14} color={colors.secondaryLabel} />
            )}
        </View>
    );
}

/**
 * One BFF check. Tapping the row runs it; once it has a result, the chevron shows or hides the response.
 */
export function CheckRow({ check, result, running, disabled, onRun }: { check: ConnectionCheck; result?: ApiResult; running: boolean; disabled: boolean; onRun: () => void }) {
    const colors = useColors();
    const [expanded, setExpanded] = useState(false);
    const meta = result ? (result.status === 0 ? 'No response' : `${result.status} · ${result.durationMs} ms`) : check.path;

    return (
        <View>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Run ${check.title}`}
                accessibilityState={{ disabled, busy: running }}
                disabled={disabled || running}
                onPress={onRun}
                // The chevron is nested in this button, where screen readers cannot focus it: offer it as an action.
                accessibilityActions={result ? [{ name: 'toggleResponse', label: expanded ? 'Hide response' : 'Show response' }] : undefined}
                onAccessibilityAction={(event) => {
                    if (event.nativeEvent.actionName === 'toggleResponse') setExpanded((value) => !value);
                }}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.smd,
                    backgroundColor: pressed ? colors.fillBackground : 'transparent',
                    opacity: disabled ? 0.5 : 1,
                })}
            >
                <StatusBadge result={result} running={running} colors={colors} />
                <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText variant="headline">{check.title}</ThemedText>
                    <ThemedText variant="footnote" style={{ fontVariant: ['tabular-nums'], color: result && !result.ok ? colors.danger : undefined }} numberOfLines={1}>
                        {meta}
                    </ThemedText>
                </View>
                {result ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Hide response' : 'Show response'} hitSlop={12} onPress={() => setExpanded((value) => !value)}>
                        <Icon name={expanded ? { ios: 'chevron.up', android: 'expand_less' } : { ios: 'chevron.down', android: 'expand_more' }} size={18} color={colors.secondaryLabel} />
                    </Pressable>
                ) : null}
            </Pressable>

            {result && expanded ? (
                <View
                    style={{ marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.fillBackground, borderRadius: radius.md, borderCurve: 'continuous', padding: spacing.md }}
                >
                    <ThemedText variant="mono" selectable>
                        {preview(result)}
                    </ThemedText>
                </View>
            ) : null}
        </View>
    );
}
