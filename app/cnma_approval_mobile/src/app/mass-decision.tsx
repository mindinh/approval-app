import { useLocalSearchParams } from 'expo-router';
import { MassDecisionSheet } from '@/screens/mass-decision';
import { firstParam } from '@/utils/route-params';

export default function MassDecisionRoute() {
    const { kind } = useLocalSearchParams<{ kind?: string | string[] }>();
    return <MassDecisionSheet kind={firstParam(kind) === 'reject' ? 'reject' : 'approve'} />;
}
