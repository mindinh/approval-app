import { Drawer, DrawerContent } from '@cnma/react-ui';
import { FilterBar } from '@/components/filterbar';
import type { useTaskFilters } from '@/pages/Inbox/hooks/useTaskFilters';

/** The subset of the task filter state the drawer renders. */
type DrawerFilters = Pick<
    ReturnType<typeof useTaskFilters>,
    'filterConfig' | 'allFilterConfig' | 'filterValues' | 'setFilterValues' | 'handleFilterApply' | 'handleFilterClear' | 'handleAdaptFilter'
>;

export interface TaskListFilterDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: DrawerFilters;
    isRefreshing: boolean;
}

export function TaskListFilterDrawer({
    open,
    onOpenChange,
    filters,
    isRefreshing,
}: TaskListFilterDrawerProps) {
    return (
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            direction="bottom"
        >
            <DrawerContent className="h-[100dvh] rounded-none border-none p-0">
                <FilterBar
                    isMobile={true}
                    config={filters.filterConfig}
                    allFilterConfig={filters.allFilterConfig}
                    values={filters.filterValues}
                    onChange={filters.setFilterValues}
                    onApply={(v) => {
                        filters.handleFilterApply(v);
                        onOpenChange(false);
                    }}
                    onClear={filters.handleFilterClear}
                    onAdaptFilter={filters.handleAdaptFilter}
                    isLoading={isRefreshing}
                />
            </DrawerContent>
        </Drawer>
    );
}
