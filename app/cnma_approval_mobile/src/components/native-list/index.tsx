import { FieldGroup, Host, ListItem, RNHostView, Switch, Text, type ListItemProps } from '@expo/ui';
import type { SymbolViewProps } from 'expo-symbols';
import type { ReactElement, ReactNode } from 'react';
import { Platform, useColorScheme, View } from 'react-native';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useColors, type ThemeColors } from '@/theme';
import { formModifiers, rowModifiers } from './styles';

/*
 * Native grouped settings list (@expo/ui): SwiftUI `Form` on iOS, a Material 3 grouped list on Android.
 * Rows, separators, press feedback and Dynamic Type come from the platform; the app palette is applied on
 * top so it matches the other screens in light and dark mode.
 *
 * `FieldGroup` and `FieldGroup.Section` style their *direct* `FieldGroup.Section` / `ListItem` children
 * (checked by element type), so the helpers below return those elements instead of wrapping them in
 * components of their own.
 */

/** The scrollable list root. Children: `<FieldGroup.Section>` elements. */
export function NativeList({ children }: { children: ReactNode }) {
    const colors = useColors();
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    return (
        <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={colors.accent}>
            <FieldGroup style={{ backgroundColor: colors.groupedBackground }} modifiers={formModifiers(colors)}>
                {children}
            </FieldGroup>
        </Host>
    );
}

/** Footer note under a section. */
export function sectionFooter(colors: ThemeColors, text: string): ReactElement {
    return (
        <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: colors.secondaryLabel }}>{text}</Text>
        </FieldGroup.SectionFooter>
    );
}

/** React Native content inside a row slot: iOS ListItem hosts it itself, Compose needs an RNHostView. */
function hosted(node: ReactElement): ReactElement {
    return Platform.OS === 'android' ? <RNHostView matchContents>{node}</RNHostView> : node;
}

export interface RowOptions {
    key: string;
    title: string;
    value?: string;
    icon?: SymbolViewProps['name'];
    /** Replaces the value (e.g. a loading skeleton). */
    accessory?: ReactElement;
    onPress?: () => void;
    destructive?: boolean;
}

/**
 * Settings row: icon, title and a trailing value (or accessory). With `onPress` it is a native button row
 * with a chevron; `destructive` tints it red (Sign out).
 */
export function row(colors: ThemeColors, { key, title, value, icon, accessory, onPress, destructive = false }: RowOptions): ReactElement<ListItemProps> {
    const tint = destructive ? colors.danger : colors.label;
    const trailing =
        accessory ??
        (value ? (
            <ThemedText variant="body" numberOfLines={1} style={{ color: colors.secondaryLabel, maxWidth: 210, textAlign: 'right' }}>
                {value}
            </ThemedText>
        ) : onPress && !destructive ? (
            <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} size={13} color={colors.tertiaryLabel} />
        ) : undefined);

    return (
        <ListItem
            key={key}
            onPress={onPress}
            modifiers={rowModifiers(colors)}
            colors={{ containerColor: colors.cardBackground, contentColor: tint }}
            leading={icon ? hosted(<Icon name={icon} size={20} color={destructive ? colors.danger : colors.secondaryLabel} />) : undefined}
            trailing={trailing ? hosted(trailing) : undefined}
        >
            <Text textStyle={{ fontSize: 17, color: tint }} numberOfLines={1}>
                {title}
            </Text>
        </ListItem>
    );
}

/** Free React Native content as a full-width row (profile card, segmented control, inline error). */
export function contentRow(colors: ThemeColors, key: string, content: ReactElement): ReactElement {
    const host = (
        <RNHostView key={key} matchContents={{ vertical: true }} modifiers={rowModifiers(colors)}>
            <View style={{ width: '100%' }}>{content}</View>
        </RNHostView>
    );
    // Compose: inside a ListItem in the card color (a bare child would get the Material surface tint).
    return Platform.OS === 'android' ? (
        <ListItem key={key} colors={{ containerColor: colors.cardBackground }}>
            {host}
        </ListItem>
    ) : (
        host
    );
}

export interface ToggleRowOptions {
    key: string;
    title: string;
    icon?: SymbolViewProps['name'];
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
}

/** Settings row with a native switch (SwiftUI Toggle / Material 3 Switch) as its trailing control. */
export function toggleRow(colors: ThemeColors, { key, title, icon, value, onValueChange, disabled = false }: ToggleRowOptions): ReactElement<ListItemProps> {
    return (
        <ListItem
            key={key}
            modifiers={rowModifiers(colors)}
            colors={{ containerColor: colors.cardBackground, contentColor: colors.label }}
            leading={icon ? hosted(<Icon name={icon} size={20} color={colors.secondaryLabel} />) : undefined}
            trailing={<Switch value={value} onValueChange={onValueChange} disabled={disabled} />}
        >
            <Text textStyle={{ fontSize: 17, color: colors.label }} numberOfLines={1}>
                {title}
            </Text>
        </ListItem>
    );
}
