import { Fragment, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/icon';
import { InfoRow } from '@/components/info-row';
import { RowSeparator, Section } from '@/components/section';
import { ThemedText } from '@/components/themed-text';
import { isExpoGo } from '@/lib/auth/redirect';
import { useSession } from '@/lib/auth/session';
import type { AppConfig } from '@/lib/config/env';
import { spacing, useColors } from '@/theme';

/** Collapsible technical details: what this build talks to and the redirect URI Entra must know. */
export function EnvironmentSection({ config }: { config: AppConfig }) {
    const colors = useColors();
    const { redirectUri } = useSession();
    const [expanded, setExpanded] = useState(false);

    const rows = [
        { label: 'BFF base URL', value: config.apiBaseUrl },
        { label: 'Redirect URI', value: redirectUri },
        { label: 'Runtime', value: isExpoGo ? 'Expo Go' : 'Native build' },
        { label: 'Tenant ID', value: config.entra.tenantId },
        { label: 'Client ID', value: config.entra.clientId },
        { label: 'API scope', value: config.entra.apiScope },
    ];

    return (
        <Section title="Environment" footer={expanded ? 'Register the redirect URI under Authentication → Mobile and desktop applications in the Entra app registration.' : undefined}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpanded((value) => !value)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: pressed ? colors.fillBackground : 'transparent' })}
            >
                <Icon name={{ ios: 'server.rack', android: 'dns' }} size={20} color={colors.secondaryLabel} />
                <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText variant="body">Connection details</ThemedText>
                    <ThemedText variant="footnote" numberOfLines={1}>
                        {isExpoGo ? 'Expo Go' : 'Native build'} · {redirectUri}
                    </ThemedText>
                </View>
                <Icon name={expanded ? { ios: 'chevron.up', android: 'expand_less' } : { ios: 'chevron.down', android: 'expand_more' }} size={18} color={colors.secondaryLabel} />
            </Pressable>
            {expanded
                ? rows.map((row) => (
                      <Fragment key={row.label}>
                          <RowSeparator />
                          <InfoRow label={row.label} value={row.value} mono />
                      </Fragment>
                  ))
                : null}
        </Section>
    );
}
