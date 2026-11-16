import { Fragment, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { RowSeparator, Section } from '@/components/section';
import { Pill } from '@/components/pill';
import { getJson, type ApiResult } from '@/lib/api/http-client';
import { haptics } from '@/lib/haptics';
import { useSession } from '@/lib/auth/session';
import { spacing } from '@/theme';
import { CheckRow } from './check-row';
import { CONNECTION_CHECKS, type ConnectionCheck } from './checks';

/** Separator inset: aligns with the row title (status badge 32 + gap 16 + padding 16). */
const ROW_TEXT_INSET = 64;

function notify(ok: boolean) {
    if (ok) haptics.success();
    else haptics.error();
}

export function SapChecksSection({ apiBaseUrl }: { apiBaseUrl: string }) {
    const { status, getAccessToken } = useSession();
    const [results, setResults] = useState<Record<string, ApiResult>>({});
    const [running, setRunning] = useState<ReadonlySet<string>>(new Set());
    const signedIn = status === 'signedIn';

    const finished = CONNECTION_CHECKS.filter((check) => results[check.id]);
    const passed = finished.filter((check) => results[check.id].ok).length;

    const setRunningFor = (id: string, isRunning: boolean) =>
        setRunning((current) => {
            const next = new Set(current);
            if (isRunning) next.add(id);
            else next.delete(id);
            return next;
        });

    const execute = async (check: ConnectionCheck): Promise<ApiResult | null> => {
        const token = await getAccessToken();
        if (!token) return null;
        setRunningFor(check.id, true);
        const result = await getJson(apiBaseUrl, check.path, token);
        setResults((current) => ({ ...current, [check.id]: result }));
        setRunningFor(check.id, false);
        return result;
    };

    const runOne = async (check: ConnectionCheck) => {
        const result = await execute(check);
        if (result) notify(result.ok);
    };

    const runAll = async () => {
        let allOk = true;
        for (const check of CONNECTION_CHECKS) {
            const result = await execute(check);
            allOk &&= result?.ok ?? false;
        }
        notify(allOk);
    };

    return (
        <Section
            title="SAP connection"
            accessory={finished.length > 0 ? <Pill label={`${passed}/${CONNECTION_CHECKS.length} passed`} tone={passed === finished.length ? 'success' : 'danger'} /> : null}
            footer={
                signedIn
                    ? 'Tap a check to run it. Locally the BFF calls SAP with its technical user, so "SAP session user" shows that user until principal propagation runs on BTP.'
                    : 'Sign in first — every call sends your Entra access token as a Bearer token.'
            }
        >
            {CONNECTION_CHECKS.map((check, index) => (
                <Fragment key={check.id}>
                    {index > 0 ? <RowSeparator inset={ROW_TEXT_INSET} /> : null}
                    <CheckRow check={check} result={results[check.id]} running={running.has(check.id)} disabled={!signedIn} onRun={() => runOne(check)} />
                </Fragment>
            ))}
            <View style={{ padding: spacing.md }}>
                <Button title="Run all checks" onPress={runAll} disabled={!signedIn || running.size > 0} loading={running.size > 0} />
            </View>
        </Section>
    );
}
