import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { CopyableText } from '@/components/copyable-text';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { ToneText, toneColors } from '@/components/tone-text';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/lib/haptics';
import { cardSurface, cssEasing, duration, easing, radius, riseIn, spacing, useColors } from '@/theme';
import type { ApprovalStep } from '@/utils/task-detail';
import { currentStepIndex, formatPosted, stepState, type StepKind, type StepState } from '@/utils/workflow-steps';

const DOT = 30;
const noteIn = FadeIn.duration(duration.base).easing(easing.out);
const noteOut = FadeOut.duration(duration.fast);
const reflow = LinearTransition.duration(duration.base).easing(easing.out);

/** Connector below a step: solid green once done, dotted otherwise (red after a rejection, amber below the current step). */
function Connector({ kind }: { kind: StepKind }) {
    const colors = useColors();
    const done = kind === 'approved';
    const color = done ? colors.success : kind === 'rejected' ? colors.danger : kind === 'current' ? colors.pending : colors.separator;
    return <View style={{ flex: 1, width: 0, marginVertical: 4, borderLeftWidth: 2, borderStyle: done ? 'solid' : 'dashed', borderColor: done ? `${color}99` : color }} />;
}

function StepRow({ step, state, last, index }: { step: ApprovalStep; state: StepState; last: boolean; index: number }) {
    const colors = useColors();
    const reduceMotion = useReducedMotion();
    const [noteOpen, setNoteOpen] = useState(false);
    const tint = toneColors(colors, state.tone);
    const posted = formatPosted(step);
    const highlighted = state.kind === 'current';

    const toggleNote = () => {
        haptics.selection();
        setNoteOpen((open) => !open);
    };

    return (
        <Animated.View entering={riseIn(index, reduceMotion)} layout={reflow} style={{ flexDirection: 'row', gap: spacing.smd }}>
            <View style={{ alignItems: 'center' }}>
                <View
                    style={{
                        width: DOT,
                        height: DOT,
                        borderRadius: radius.full,
                        backgroundColor: state.kind === 'pending' || state.kind === 'next' ? colors.cardBackground : tint.background,
                        borderWidth: state.kind === 'pending' || state.kind === 'next' ? 1.5 : 0,
                        borderColor: colors.separator,
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: highlighted ? `0 0 0 4px ${colors.pendingSoft}` : undefined,
                    }}
                >
                    <Icon name={state.icon} size={13} color={state.kind === 'pending' || state.kind === 'next' ? colors.tertiaryLabel : tint.foreground} />
                </View>
                {last ? null : <Connector kind={state.kind} />}
            </View>

            <View style={{ flex: 1, gap: 6, paddingBottom: last ? 0 : spacing.lg }}>
                <ThemedText variant="caption" style={{ color: colors.tertiaryLabel, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Level {step.level}
                    {step.releaseText || step.releaseCode ? ` • ${step.releaseText || `Code ${step.releaseCode}`}` : ''}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <ThemedText variant="subhead" numberOfLines={2} style={{ flex: 1, color: colors.label, fontWeight: '600' }}>
                        {step.approver || `Level ${step.level}`}
                    </ThemedText>
                    {state.badges.map((badge) => (
                        <ToneText key={badge.label} label={badge.label} tone={badge.tone} />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: 2 }}>
                    <ThemedText variant="caption">
                        Status:{' '}
                        <ThemedText variant="caption" style={{ color: tint.foreground, fontWeight: '600' }}>
                            {state.label}
                        </ThemedText>
                    </ThemedText>
                    {posted ? (
                        <ThemedText variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                            {state.dateLabel}{' '}
                            <ThemedText variant="caption" style={{ color: colors.label }}>
                                {posted}
                            </ThemedText>
                        </ThemedText>
                    ) : null}
                </View>

                {step.note ? (
                    <View style={{ gap: spacing.xs }}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: noteOpen }}
                            onPress={toggleNote}
                            hitSlop={8}
                            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}
                        >
                            <Icon name={{ ios: 'text.bubble', android: 'chat_bubble' }} size={12} color={colors.secondaryLabel} />
                            <ThemedText variant="caption" style={{ color: colors.secondaryLabel, fontWeight: '600' }}>
                                {noteOpen ? 'Hide comment' : 'Show more'}
                            </ThemedText>
                            <Animated.View
                                style={{
                                    transform: [{ rotate: noteOpen ? '180deg' : '0deg' }],
                                    transitionProperty: 'transform',
                                    transitionDuration: duration.fast,
                                    transitionTimingFunction: cssEasing.out,
                                }}
                            >
                                <Icon name={{ ios: 'chevron.down', android: 'expand_more' }} size={10} color={colors.secondaryLabel} />
                            </Animated.View>
                        </Pressable>
                        {noteOpen ? (
                            <Animated.View
                                entering={noteIn}
                                exiting={noteOut}
                                style={{
                                    padding: spacing.smd,
                                    borderRadius: radius.md,
                                    borderCurve: 'continuous',
                                    backgroundColor: state.kind === 'rejected' ? colors.dangerSoft : colors.fillBackground,
                                }}
                            >
                                <CopyableText variant="footnote" label="comment" style={{ color: state.kind === 'rejected' ? colors.danger : colors.label }}>
                                    {step.note}
                                </CopyableText>
                            </Animated.View>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Animated.View>
    );
}

/** Approval steps as a vertical timeline with the same content as the web "Workflow Progress" panel. */
export function WorkflowTab({ steps }: { steps: readonly ApprovalStep[] }) {
    const colors = useColors();
    if (steps.length === 0) {
        return (
            <EmptyState
                icon={{ ios: 'point.3.connected.trianglepath.dotted', android: 'account_tree' }}
                tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }}
                title="No workflow approval steps found for this task."
            />
        );
    }

    const currentIndex = currentStepIndex(steps);

    return (
        <View style={{ padding: spacing.md, ...cardSurface(colors) }}>
            <ThemedText variant="caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5, paddingBottom: spacing.md, marginBottom: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.separator }}>
                Workflow Progress
            </ThemedText>
            {steps.map((step, index) => (
                <StepRow key={step.key} step={step} index={index} last={index === steps.length - 1} state={stepState(step, index, currentIndex, steps.length)} />
            ))}
        </View>
    );
}
