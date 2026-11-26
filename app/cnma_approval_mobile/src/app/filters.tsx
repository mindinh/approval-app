import { useLocalSearchParams } from 'expo-router';
import { FilterSheetScreen } from '@/screens/task-list/filter-sheet';

export default function FiltersRoute() {
    const { scope } = useLocalSearchParams<{ scope?: string }>();
    return <FilterSheetScreen scope={scope === 'approved' ? 'approved' : 'open'} />;
}
