import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useDismiss } from '@/hooks/use-dismiss';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { RowSeparator, Section } from '@/components/section';
import { SheetHeader } from '@/components/sheet-header';
import { ThemedText } from '@/components/themed-text';
import { useWorklistFilters } from '@/hooks/use-worklist-filters';
import type { TaskScope } from '@/lib/api/bff-api';
import { haptics } from '@/lib/haptics';
import { cssEasing, duration, easing, layout, radius, spacing, useColors } from '@/theme';
import { formatDate } from '@/utils/format';
import { EMPTY_FILTERS, TASK_TYPE_OPTIONS, activeFilterCount, fromDayKey, subtypeGroupsFor, toDayKey, toggleDocumentType, type TaskFilters } from '@/utils/task-filters';

const IS_IOS = process.env.EXPO_OS === 'ios';
const DAY_MS = 24 * 60 * 60 * 1000;
const fieldIn = FadeIn.duration(duration.base).easing(easing.out);

type RangePreset = { label: string; days: number };
/** Quick ranges for "Created on" (the web uses a free date range; presets save taps on a phone). */
const PRESETS: readonly RangePreset[] = [
    { label: 'Today', days: 0 },
    { label: '7 days', days: 6 },
    { label: '30 days', days: 29 },
    { label: '90 days', days: 89 },
];

function presetRange(days: number): { createdFrom: string; createdTo: string } {
    const today = new Date();
    return { createdFrom: toDayKey(new Date(today.getTime() - days * DAY_MS)), createdTo: toDayKey(today) };
}

/** Selectable capsule (subtypes, presets). Background + check change with a short transition. */
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    const colors = useColors();
    return (
        <PressableScale
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => {
                haptics.selection();
                onPress();
            }}
            scale={0.97}
        >
            <Animated.View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: spacing.smd,
                    minHeight: 34,
                    paddingVertical: 6,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.separator,
                    backgroundColor: selected ? colors.accentSoft : colors.cardBackground,
                    transitionProperty: ['backgroundColor', 'borderColor'],
                    transitionDuration: duration.fast,
                    transitionTimingFunction: cssEasing.out,
                }}
            >
                {selected ? <Icon name={{ ios: 'checkmark', android: 'check' }} size={11} color={colors.accent} /> : null}
                <ThemedText variant="subhead" style={{ color: selected ? colors.accent : colors.label, fontWeight: selected ? '600' : '400' }}>
                    {label}
                </ThemedText>
            </Animated.View>
        </PressableScale>
    );
}

/**
 * One "From" / "To" row. iOS: the native compact date button (tap → calendar popover).
 * Android: a row that opens the Material date dialog.
 */
function DateRow({
    label,
    value,
    minimumDate,
    maximumDate,
    onChange,
    onClear,
}: {
    label: string;
    value?: string;
    minimumDate?: Date;
    maximumDate?: Date;
    onChange: (day: string) => void;
    onClear: () => void;
}) {
    const colors = useColors();
    const [dialogOpen, setDialogOpen] = useState(false);
    // iOS: tapping "Any" shows the date control with a suggested day, but filters apply live, so nothing is
    // committed until the user actually picks a date.
    const [picking, setPicking] = useState(false);
    const date = value ? fromDayKey(value) : undefined;
    const pickerDate = date ?? (picking ? (maximumDate ?? new Date()) : undefined);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smd, minHeight: 52, paddingHorizontal: spacing.md }}>
            <ThemedText variant="body" style={{ flex: 1 }}>
                {label}
            </ThemedText>
            {IS_IOS && pickerDate ? (
                <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="compact"
                    accentColor={colors.accent}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onValueChange={(_event, picked) => {
                        setPicking(false);
                        onChange(toDayKey(picked));
                    }}
                />
            ) : (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${label}, ${date ? formatDate(value) : 'any date'}`}
                    onPress={() => {
                        haptics.light();
                        if (IS_IOS) setPicking(true);
                        else setDialogOpen(true);
                    }}
                    style={({ pressed }) => ({ paddingHorizontal: spacing.smd, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: pressed ? colors.accentSoft : colors.fillBackground })}
                >
                    <ThemedText variant="body" style={{ color: date ? colors.label : colors.accent }}>
                        {date ? formatDate(value) : 'Any'}
                    </ThemedText>
                </Pressable>
            )}
            {date || picking ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Clear ${label}`}
                    hitSlop={10}
                    onPress={() => {
                        setPicking(false);
                        if (date) onClear();
                    }}
                >
                    <Icon name={{ ios: 'xmark.circle.fill', android: 'cancel' }} size={18} color={colors.tertiaryLabel} />
                </Pressable>
            ) : null}
            {!IS_IOS && dialogOpen ? (
                <DateTimePicker
                    value={date ?? maximumDate ?? new Date()}
                    mode="date"
                    accentColor={colors.accent}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onValueChange={(_event, picked) => {
                        setDialogOpen(false);
                        onChange(toDayKey(picked));
                    }}
                    onDismiss={() => setDialogOpen(false)}
                />
            ) : null}
        </View>
    );
}

/**
 * Worklist filters as a native form sheet: task type (segmented), "Created on" range (presets +
 * native date pickers) and document subtypes as chips. Changes apply live; Reset clears everything.
 */
export function FilterSheetScreen({ scope }: { scope: TaskScope }) {
    const dismiss = useDismiss();
    const colors = useColors();
    const { category, filters, setFilters } = useWorklistFilters(scope);
    const groups = subtypeGroupsFor(category);
    const active = activeFilterCount(filters) > 0;
    const today = new Date();

    const patch = (next: Partial<TaskFilters>) => setFilters({ ...filters, ...next });
    const presetSelected = (preset: RangePreset) => {
        const range = presetRange(preset.days);
        return filters.createdFrom === range.createdFrom && filters.createdTo === range.createdTo;
    };

    return (
        <ScreenScrollView maxWidth={layout.maxFormWidth}>
            <SheetHeader
                title="Filters"
                onDone={dismiss}
                leading={{
                    label: 'Reset',
                    disabled: !active,
                    onPress: () => {
                        haptics.light();
                        setFilters(EMPTY_FILTERS);
                    },
                }}
            />

            <Section title="Task type">
                <View style={{ padding: spacing.smd }}>
                    <SegmentedControl
                        values={TASK_TYPE_OPTIONS.map((option) => option.label)}
                        selectedIndex={TASK_TYPE_OPTIONS.findIndex((option) => option.value === filters.taskType)}
                        tintColor={colors.accent}
                        accessibilityLabel="Task type"
                        onChange={(event) => {
                            const next = TASK_TYPE_OPTIONS[event.nativeEvent.selectedSegmentIndex]?.value;
                            if (!next || next === filters.taskType) return;
                            haptics.selection();
                            patch({ taskType: next });
                        }}
                    />
                </View>
            </Section>

            <Section title="Created on" footer="Document creation date, as in the web filter.">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.smd }}>
                    {PRESETS.map((preset) => (
                        <Chip
                            key={preset.label}
                            label={preset.label}
                            selected={presetSelected(preset)}
                            onPress={() => (presetSelected(preset) ? patch({ createdFrom: undefined, createdTo: undefined }) : patch(presetRange(preset.days)))}
                        />
                    ))}
                </View>
                <RowSeparator />
                <DateRow
                    label="From"
                    value={filters.createdFrom}
                    maximumDate={filters.createdTo ? fromDayKey(filters.createdTo) : today}
                    onChange={(createdFrom) => patch({ createdFrom })}
                    onClear={() => patch({ createdFrom: undefined })}
                />
                <RowSeparator />
                <DateRow
                    label="To"
                    value={filters.createdTo}
                    minimumDate={filters.createdFrom ? fromDayKey(filters.createdFrom) : undefined}
                    maximumDate={today}
                    onChange={(createdTo) => patch({ createdTo })}
                    onClear={() => patch({ createdTo: undefined })}
                />
            </Section>

            {groups.map((group) => (
                <Animated.View key={group.category} entering={fieldIn} exiting={FadeOut.duration(duration.fast)}>
                    <Section title={group.title}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.smd }}>
                            {group.options.map((type) => {
                                const selected = filters.documentTypes.includes(type);
                                return <Chip key={type} label={type} selected={selected} onPress={() => setFilters(toggleDocumentType(filters, type, !selected))} />;
                            })}
                        </View>
                    </Section>
                </Animated.View>
            ))}
        </ScreenScrollView>
    );
}
