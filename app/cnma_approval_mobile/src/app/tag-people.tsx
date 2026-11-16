import { useLocalSearchParams } from 'expo-router';
import { TagPeopleSheet } from '@/screens/tag-people';
import { firstParam } from '@/utils/route-params';

export default function TagPeopleRoute() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    return <TagPeopleSheet instanceId={firstParam(id)} />;
}
