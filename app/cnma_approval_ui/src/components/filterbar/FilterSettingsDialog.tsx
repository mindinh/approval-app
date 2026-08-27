/**
 * FilterSettingsDialog — Adapt Filter dialog (SAP UI5 style)
 * Simplified version without @dnd-kit drag-and-drop; uses button reordering.
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown } from 'lucide-react';
import { Button, Input, Checkbox, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@cnma/react-ui';
import type { FilterSettingItem } from './types';

interface FilterSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: FilterSettingItem[];
    onApply: (filters: FilterSettingItem[]) => void;
}

export function FilterSettingsDialog({
    open,
    onOpenChange,
    filters,
    onApply,
}: FilterSettingsDialogProps) {
    const [localFilters, setLocalFilters] = useState<FilterSettingItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showUnselected, setShowUnselected] = useState(false);

    // Initialize on open
    useEffect(() => {
        if (open) {
            setLocalFilters([...filters]);
            setSearchQuery('');
            setSelectedIndex(null);
            setShowUnselected(false);
        }
    }, [open, filters]);

    const filteredList = useMemo(() => {
        let result = localFilters;
        if (searchQuery) {
            result = result.filter(f =>
                f.label.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (showUnselected) {
            result = result.filter(f => f.visible);
        }
        return result;
    }, [localFilters, searchQuery, showUnselected]);

    const visibleCount = localFilters.filter(f => f.visible).length;

    const toggleVisibility = (name: string) => {
        setLocalFilters(prev =>
            prev.map(f => (f.name === name ? { ...f, visible: !f.visible } : f))
        );
    };

    const moveFilter = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= localFilters.length) return;
        setLocalFilters(prev => {
            const next = [...prev];
            const [item] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, item);
            return next;
        });
        setSelectedIndex(toIndex);
    };

    const getRealIndex = (name: string): number => {
        return localFilters.findIndex(f => f.name === name);
    };

    const handleApply = () => {
        onApply(localFilters);
        onOpenChange(false);
    };

    const searchActive = !!searchQuery || showUnselected;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[92vw] sm:max-w-md max-h-[85dvh] my-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle>Adapt Filter</DialogTitle>
                </DialogHeader>

                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search"
                        type="search"
                        inputMode="search"
                        autoComplete="off"
                        className="pl-9 h-11 sm:h-9 text-base"
                    />
                </div>

                {/* Toggle unselected */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Field ({visibleCount}/{localFilters.length})</span>
                    <Button
                        variant="link"
                        onClick={() => setShowUnselected(!showUnselected)}
                        className="text-primary h-auto p-0 text-xs min-h-[44px] sm:min-h-0 flex items-center"
                    >
                        {showUnselected ? 'Show All' : 'Hide Unselected'}
                    </Button>
                </div>

                {/* Filter list */}
                <div className="flex-1 min-h-0 overflow-y-auto border rounded-md divide-y">
                    {filteredList.map(filter => {
                        const realIdx = getRealIndex(filter.name);
                        const isSelected = selectedIndex === realIdx;
                        return (
                            <div
                                key={filter.name}
                                onClick={() => setSelectedIndex(realIdx)}
                                className={`flex items-center gap-2 px-2 py-2.5 cursor-pointer transition-colors min-h-[44px] ${
                                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                                }`}
                            >
                                <Checkbox
                                    checked={filter.visible}
                                    onCheckedChange={() => toggleVisibility(filter.name)}
                                    onClick={e => e.stopPropagation()}
                                />
                                <span className="text-sm flex-1">{filter.label}</span>
                                {isSelected && !searchActive && (
                                    <div className="flex items-center gap-0.5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={e => { e.stopPropagation(); moveFilter(realIdx, 0); }}
                                            className="h-11 w-11 sm:h-7 sm:w-7 p-0"
                                            title="Move to top"
                                            disabled={realIdx === 0}
                                        >
                                            <ChevronsUp className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={e => { e.stopPropagation(); moveFilter(realIdx, realIdx - 1); }}
                                            className="h-11 w-11 sm:h-7 sm:w-7 p-0"
                                            title="Move up"
                                            disabled={realIdx === 0}
                                        >
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={e => { e.stopPropagation(); moveFilter(realIdx, realIdx + 1); }}
                                            className="h-11 w-11 sm:h-7 sm:w-7 p-0"
                                            title="Move down"
                                            disabled={realIdx === localFilters.length - 1}
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={e => { e.stopPropagation(); moveFilter(realIdx, localFilters.length - 1); }}
                                            className="h-11 w-11 sm:h-7 sm:w-7 p-0"
                                            title="Move to bottom"
                                            disabled={realIdx === localFilters.length - 1}
                                        >
                                            <ChevronsDown className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="grid grid-cols-2 gap-3 pt-3 border-t sm:flex sm:justify-end sm:gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 sm:h-9 font-medium">
                        Cancel
                    </Button>
                    <Button variant="action" onClick={handleApply} className="h-11 sm:h-9 font-medium">
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
