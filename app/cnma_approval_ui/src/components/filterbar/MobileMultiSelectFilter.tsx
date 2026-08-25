import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Check, Loader2 } from 'lucide-react';
import { Button, Input } from '@cnma/react-ui';
import type { MultiSelectFilterConfig, SelectOption } from './types';

interface MobileMultiSelectFilterProps {
    config: MultiSelectFilterConfig;
    value: any;
    onChange: (value: any) => void;
}

export function MobileMultiSelectFilter({
    config,
    value,
    onChange,
}: MobileMultiSelectFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [options, setOptions] = useState<SelectOption[]>(config.options || []);
    const [isLoading, setIsLoading] = useState(false);

    // Sync options if config updates
    useEffect(() => {
        if (config.options && config.options.length > 0) {
            setOptions(config.options);
        }
    }, [config.options]);

    // Async loader if optionsLoader is provided
    useEffect(() => {
        if (config.optionsLoader && (!config.options || config.options.length === 0)) {
            let isMounted = true;
            setIsLoading(true);
            config.optionsLoader()
                .then((opts) => {
                    if (isMounted) setOptions(opts);
                })
                .catch(console.error)
                .finally(() => {
                    if (isMounted) setIsLoading(false);
                });
            return () => {
                isMounted = false;
            };
        }
    }, [config.optionsLoader, config.options]);

    const globalSelectedValues: string[] = useMemo(() => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value) return [value];
        return [];
    }, [value]);

    // Local selection state to prevent heavy parent task-list re-renders on every checkbox tap
    const [localSelected, setLocalSelected] = useState<string[]>(globalSelectedValues);

    // Sync local state when modal opens
    const handleOpen = () => {
        setLocalSelected(globalSelectedValues);
        setSearchQuery('');
        setIsOpen(true);
    };

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase().trim();
        return options.filter((opt) => opt.label.toLowerCase().includes(q));
    }, [options, searchQuery]);

    const handleToggle = (optValue: string) => {
        setLocalSelected((prev) =>
            prev.includes(optValue)
                ? prev.filter((v) => v !== optValue)
                : [...prev, optValue]
        );
    };

    const handleSelectAll = () => {
        setLocalSelected(filteredOptions.map((o) => o.value));
    };

    const handleClearAll = () => {
        setLocalSelected([]);
    };

    const handleApply = () => {
        onChange(localSelected);
        setIsOpen(false);
    };

    const placeholder = config.placeholder || 'Select...';

    // Build label display for trigger box
    const triggerLabel = useMemo(() => {
        if (globalSelectedValues.length === 0) return placeholder;
        if (globalSelectedValues.length === 1) {
            const found = options.find((o) => o.value === globalSelectedValues[0]);
            return found ? found.label : globalSelectedValues[0];
        }
        return `${globalSelectedValues.length} selected`;
    }, [globalSelectedValues, options, placeholder]);

    return (
        <>
            {/* ── Compact Trigger Input Box ── */}
            <div
                onClick={handleOpen}
                className="w-full h-11 px-3.5 border border-input rounded-md bg-card hover:border-primary/50 transition-all flex items-center justify-between cursor-pointer select-none shadow-xs group"
            >
                <span
                    className={`text-sm font-normal truncate ${
                        globalSelectedValues.length === 0
                            ? 'text-muted-foreground'
                            : 'text-foreground'
                    }`}
                >
                    {triggerLabel}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
            </div>

            {/* ── Mobile Sub-Sheet Overlay ── */}
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] pointer-events-auto bg-black/50 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
                    {/* Backdrop Click */}
                    <div className="flex-1" onClick={() => setIsOpen(false)} />

                    {/* Sub-Sheet Content Container */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-[75dvh] max-h-[85dvh] bg-background rounded-t-2xl shadow-2xl flex flex-col border-t border-border animate-in slide-in-from-bottom duration-200"
                    >
                        {/* Drag Pill Handle */}
                        <div className="pt-2.5 pb-1 flex justify-center">
                            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                        </div>

                        {/* Sheet Header */}
                        <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/60">
                            <h3 className="font-semibold text-base text-foreground">
                                {config.label}
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 rounded-full hover:bg-muted"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </div>

                        {/* Search & Batch Actions Area */}
                        <div className="px-4 pt-3 pb-2.5 bg-muted/20 border-b border-border/40 space-y-2.5">
                            {options.length > 4 && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search options..."
                                        className="pl-9 pr-8 h-10 text-sm font-normal bg-background rounded-md border-border"
                                        type="text"
                                        inputMode="search"
                                        autoComplete="off"
                                    />
                                    {searchQuery && (
                                        <X
                                            className="absolute right-3 top-3 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
                                            onClick={() => setSearchQuery('')}
                                        />
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-normal">
                                    {localSelected.length} of {options.length} selected
                                </span>
                                <div className="flex items-center gap-3">
                                    {config.showSelectAll !== false && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSelectAll}
                                            className="h-auto p-0 text-xs text-primary font-medium hover:bg-transparent hover:underline cursor-pointer"
                                        >
                                            Select All
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearAll}
                                        className="h-auto p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-destructive transition-colors font-normal cursor-pointer"
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Options List with Crisp 16px Custom Checkboxes & Native Touch Scroll */}
                        <div
                            data-vaul-no-drag
                            onTouchMove={(e) => e.stopPropagation()}
                            className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-border/40"
                        >
                            {isLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-xs">Loading options...</span>
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="py-12 text-center text-sm text-muted-foreground">
                                    No options match "{searchQuery}"
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = localSelected.includes(opt.value);
                                    return (
                                        <div
                                            key={opt.value}
                                            onClick={() => handleToggle(opt.value)}
                                            className="flex items-center gap-3 py-3 cursor-pointer active:bg-muted/50 transition-colors min-h-11 select-none"
                                        >
                                            {/* Custom 16px x 16px Crisp Checkbox */}
                                            <div
                                                className={`w-4 h-4 rounded border transition-colors flex items-center justify-center shrink-0 ${
                                                    isSelected
                                                        ? 'bg-primary border-primary text-primary-foreground'
                                                        : 'border-muted-foreground/40 bg-background'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                            <span className="text-sm font-normal text-foreground flex-1 break-words">
                                                {opt.label}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Bottom Action Button (Select / Apply) */}
                        <div className="p-4 border-t border-border bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]">
                            <Button
                                onClick={handleApply}
                                className="w-full h-11 rounded-xl font-semibold text-sm shadow-xs flex flex-col justify-center items-center py-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <span>Select</span>
                                {localSelected.length > 0 && (
                                    <span className="text-xs font-normal opacity-90">
                                        {localSelected.length} selected
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
