import {
    formatApprovalStatus,
    isApprovedApprovalStatus,
    isInApprovingStatus,
    isPendingApprovalStatus,
    isPendingVerifyStatus,
    isRejectedApprovalStatus,
    normalizeApprovalStatus,
} from '@approval-core/status-predicates';
import type { SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Pill, toneColors, type PillTone } from '@/components/pill';
import { ThemedText } from '@/components/themed-text';
import { haptics } from '@/lib/haptics';
import { cardSurface, cssEasing, duration, easing, radius, riseIn, spacing, useColors } from '@/theme';
import type { ApprovalStep } from '@/utils/task-detail';

const DOT = 30;
const noteIn = FadeIn.duration(duration.base).easing(easing.out);
const noteOut = FadeOut.duration(duration.fast);
const reflow = LinearTransition.duration(duration.base).easing(easing.out);

type StepKind = 'rejected' | 'approved' | 'pendingVerify' | 'current' | 'next' | 'pending';

interface StepState {
    kind: StepKind;
    label: string;
    tone: PillTone;
    icon: SymbolViewProps['name'];
    /** Badge beside the approver (web: Rejected / Pending Verify / Current / Next). */
    badge?: { label: string; tone: PillTone };
    dateLabel: string;
}

/** Same rules as the web WorkflowApprovalPanel: current = first in-approving, else first pending; next = current + 1. */
function stepState(step: ApprovalStep, index: number, currentIndex: number): StepState {
    const raw = normalizeApprovalStatus(step.status);
    if (isRejectedApprovalStatus(step.status)) {
        return { kind: 'rejected', label: formatApprovalStatus(raw), tone: 'danger', icon: { ios: 'xmark', android: 'close' }, badge: { label: 'Rejected', tone: 'danger' }, dateLabel: 'Rejected' };
    }
    if (isApprovedApprovalStatus(step.status)) {
        return { kind: 'approved', label: formatApprovalStatus(raw), tone: 'success', icon: { ios: 'checkmark', android: 'check' }, dateLabel: 'Approved' };
    }
    // Web rule: a step before the current one counts as done even when SAP has not flagged it approved.
    if (currentIndex >= 0 && index < currentIndex && !isPendingVerifyStatus(step.status)) {
        return { kind: 'approved', label: formatApprovalStatus(raw), tone: 'success', icon: { ios: 'checkmark', android: 'check' }, dateLabel: 'Approved' };
    }
    if (isPendingVerifyStatus(step.status)) {
        return {
            kind: 'pendingVerify',
            label: 'Pending Verify',
            tone: 'warning',
            icon: { ios: 'hourglass', android: 'hourglass_top' },
            badge: { label: 'Pending Verify', tone: 'warning' },
            dateLabel: 'Date',
        };
    }
    if (index === currentIndex) {
        return {
            kind: 'current',
            label: raw === 'PENDING' ? 'In Approving' : formatApprovalStatus(raw),
            tone: 'warning',
            icon: { ios: 'clock.fill', android: 'schedule' },
            badge: { label: 'Current', tone: 'warning' },
            dateLabel: 'Date',
        };
    }
    if (currentIndex >= 0 && index === currentIndex + 1) {
        return {
            kind: 'next',
            label: formatApprovalStatus(raw),
            tone: 'info',
            icon: { ios: 'circle', android: 'radio_button_unchecked' },
            badge: { label: 'Next', tone: 'info' },
            dateLabel: 'Date',
        };
    }
    return { kind: 'pending', label: formatApprovalStatus(raw), tone: 'neutral', icon: { ios: 'circle', android: 'radio_button_unchecked' }, dateLabel: 'Date' };
}

/** Connector below a step: solid green once done, dotted otherwise (red after a rejection, amber below the current step). */
function Connector({ kind }: { kind: StepKind }) {
    const colors = useColors();
    const done = kind === 'approved';
    const color = done ? colors.success : kind === 'rejected' ? colors.danger : kind === 'current' ? colors.warning : colors.separator;
    return <View style={{ flex: 1, width: 0, marginVertical: 4, borderLeftWidth: 2, borderStyle: done ? 'solid' : 'dashed', borderColor: done ? `${color}99` : color }} />;
}

function formatPosted(step: ApprovalStep): string {
    return [step.postedOn, step.postedTime].filter(Boolean).join(' ');
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
                        boxShadow: highlighted ? `0 0 0 4px ${colors.warningSoft}` : undefined,
                    }}
                >
                    <Icon name={state.icon} size={13} color={state.kind === 'pending' || state.kind === 'next' ? colors.tertiaryLabel : tint.foreground} />
                </View>
                {last ? null : <Connector kind={state.kind} />}
            </View>

            <View style={{ flex: 1, gap: 6, paddingBottom: last ? 0 : spacing.lg }}>
                <ThemedText variant="caption" style={{ color: colors.tertiaryLabel, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Level {step.level}
                    {step.releaseText || step.releaseCode ? ` · ${step.releaseText || `Code ${step.releaseCode}`}` : ''}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <ThemedText variant="subhead" numberOfLines={2} style={{ flex: 1, color: colors.label, fontWeight: '600' }}>
                        {step.approver || `Level ${step.level}`}
                    </ThemedText>
                    {state.badge ? <Pill label={state.badge.label} tone={state.badge.tone} compact /> : null}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: 2 }}>
                    <ThemedText variant="caption">
                        Status{' '}
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
                            <Icon name={{ ios: 'text.bubble', android: 'chat_bubble' }} size={12} color={colors.accent} />
                            <ThemedText variant="caption" style={{ color: colors.accent, fontWeight: '600' }}>
                                {noteOpen ? 'Hide comment' : 'Show comment'}
                            </ThemedText>
                            <Animated.View
                                style={{
                                    transform: [{ rotate: noteOpen ? '180deg' : '0deg' }],
                                    transitionProperty: 'transform',
                                    transitionDuration: duration.fast,
                                    transitionTimingFunction: cssEasing.out,
                                }}
                            >
                                <Icon name={{ ios: 'chevron.down', android: 'expand_more' }} size={10} color={colors.accent} />
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
                                <ThemedText variant="footnote" selectable style={{ color: state.kind === 'rejected' ? colors.danger : colors.label }}>
                                    {step.note}
                                </ThemedText>
                            </Animated.View>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Animated.View>
    );
}

/** Small summary above the timeline: how far the approval has progressed. */
function ProgressSummary({ steps }: { steps: readonly ApprovalStep[] }) {
    const colors = useColors();
    const approved = steps.filter((step) => isApprovedApprovalStatus(step.status)).length;
    const rejected = steps.some((step) => isRejectedApprovalStatus(step.status));
    const ratio = steps.length ? approved / steps.length : 0;
    return (
        <View style={{ gap: spacing.sm, paddingBottom: spacing.md, marginBottom: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.separator }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <ThemedText variant="caption" style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Workflow progress
                </ThemedText>
                <ThemedText variant="footnote" style={{ color: rejected ? colors.danger : colors.label, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                    {rejected ? 'Rejected' : `${approved} of ${steps.length} approved`}
                </ThemedText>
            </View>
            <View style={{ height: 6, borderRadius: radius.full, backgroundColor: colors.fillBackground, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(ratio * 100)}%`, height: '100%', borderRadius: radius.full, backgroundColor: rejected ? colors.danger : colors.success }} />
            </View>
        </View>
    );
}

/** Approval steps as a vertical timeline (web "Workflow progress"): state per level, dates and collapsible comments. */
export function WorkflowTab({ steps }: { steps: readonly ApprovalStep[] }) {
    const colors = useColors();
    if (steps.length === 0) {
        return (
            <EmptyState
                icon={{ ios: 'point.3.connected.trianglepath.dotted', android: 'account_tree' }}
                tint={{ foreground: colors.secondaryLabel, background: colors.fillBackground }}
                title="No approval steps"
                message="No workflow approval steps were found for this task."
            />
        );
    }

    const inApproving = steps.findIndex((step) => isInApprovingStatus(step.status));
    const currentIndex = inApproving >= 0 ? inApproving : steps.findIndex((step) => isPendingApprovalStatus(step.status));

    return (
        <View style={{ padding: spacing.md, ...cardSurface(colors) }}>
            <ProgressSummary steps={steps} />
            {steps.map((step, index) => (
                <StepRow key={step.key} step={step} index={index} last={index === steps.length - 1} state={stepState(step, index, currentIndex)} />
            ))}
        </View>
    );
}
