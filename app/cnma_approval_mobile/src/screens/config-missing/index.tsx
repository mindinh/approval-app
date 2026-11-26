import { Fragment } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InfoRow } from '@/components/info-row';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { RowSeparator, Section } from '@/components/section';
import { useColors } from '@/theme';

/** Shown instead of the app when required EXPO_PUBLIC_* variables are not set. */
export function ConfigMissingScreen({ missing }: { missing: readonly string[] }) {
    const colors = useColors();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
            <ScreenScrollView>
                <Section title="Configuration missing" footer="Copy .env.example to .env.local, fill in the values, then restart the dev script.">
                    {missing.map((name, index) => (
                        <Fragment key={name}>
                            {index > 0 ? <RowSeparator inset={52} /> : null}
                            <InfoRow icon={{ ios: 'exclamationmark.triangle', android: 'warning' }} label="Not set" value={name} mono />
                        </Fragment>
                    ))}
                </Section>
            </ScreenScrollView>
        </SafeAreaView>
    );
}
