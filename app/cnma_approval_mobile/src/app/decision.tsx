import { useLocalSearchParams } from 'expo-router';
import { DecisionSheetScreen } from '@/screens/decision';
import { firstParam } from '@/utils/route-params';

export default function DecisionRoute() {
    const { id, key } = useLocalSearchParams<{ id?: string | string[]; key?: string | string[] }>();
    return <DecisionSheetScreen instanceId={firstParam(id)} decisionKey={firstParam(key)} />;
}
