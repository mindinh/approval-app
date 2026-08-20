import { Input, MultiSelectFilter, DateRangeFilter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, useIsMobile, Button, Calendar } from '@cnma/react-ui';
import type { FilterFieldConfig } from './types';
import { MobileMultiSelectFilter } from './MobileMultiSelectFilter';
import { X } from 'lucide-react';

interface FilterBarFieldProps {
    config: FilterFieldConfig;
    value: any;
    onChange: (value: any) => void;
    isMobile?: boolean;
}

export function FilterBarField({ config, value, onChange, isMobile }: FilterBarFieldProps) {
    const isMobileDevice = isMobile ?? useIsMobile();
    const label = config.label;
    const placeholder = config.placeholder || 'Select...';

    return (
        <div className="space-y-1.5 flex flex-col" style={{ width: config.width }}>
            <Label className="text-sm font-medium text-foreground mb-1 whitespace-normal break-words">
                {label} {config.required && <span className="text-destructive">*</span>}
            </Label>

            <div className="flex-1">
                {renderFilterControl(config, value, onChange, placeholder, isMobileDevice)}
            </div>
        </div>
    );
}

function normalizeDateRange(val: any): { from?: Date; to?: Date } {
    if (!val || typeof val !== 'object') return { from: undefined, to: undefined };
    const parseDate = (d: any) => {
        if (!d) return undefined;
        if (d instanceof Date) return isNaN(d.getTime()) ? undefined : d;
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? undefined : parsed;
    };
    return {
        from: parseDate(val.from),
        to: parseDate(val.to),
    };
}

function MobileDateRangeFilter({
    value,
    onChange,
}: {
    value: any;
    onChange: (val: { from?: Date; to?: Date }) => void;
}) {
    const range = normalizeDateRange(value);

    return (
        <div className="flex flex-col items-center bg-card p-2 rounded-2xl border border-border shadow-xs w-full overflow-hidden">
            <Calendar
                mode="range"
                selected={range}
                onSelect={(selectedRange: any) => {
                    onChange(selectedRange || { from: undefined, to: undefined });
                }}
                className="w-full flex justify-center p-0"
            />
            {(range.from || range.to) && (
                <div className="w-full pt-2 mt-1 border-t border-border/60 flex items-center justify-between text-xs px-2">
                    <span className="text-muted-foreground font-medium truncate">
                        {range.from ? range.from.toLocaleDateString() : ''}
                        {range.to ? ` - ${range.to.toLocaleDateString()}` : ''}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange({ from: undefined, to: undefined })}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 rounded-lg cursor-pointer shrink-0"
                    >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Clear
                    </Button>
                </div>
            )}
        </div>
    );
}

function renderFilterControl(
    config: FilterFieldConfig,
    value: any,
    onChange: (value: any) => void,
    placeholder: string,
    isMobile: boolean
) {
    switch (config.type) {
        case 'text':
            return (
                <Input
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    maxLength={config.maxLength}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    className="h-11 sm:h-8 text-base"
                />
            );

        case 'select':
            return (
                <Select value={value || ''} onValueChange={(v) => onChange(v === '__all__' ? undefined : v)}>
                    <SelectTrigger className="h-11 sm:h-8">
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All</SelectItem>
                        {config.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                    {opt.icon && <opt.icon className="w-4 h-4" />}
                                    <span>{opt.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );

        case 'multiselect':
            if (isMobile) {
                return (
                    <MobileMultiSelectFilter
                        config={config}
                        value={value}
                        onChange={onChange}
                    />
                );
            }
            return (
                <MultiSelectFilter
                    config={config}
                    value={value}
                    onChange={onChange}
                />
            );

        case 'dateRange': {
            const normalizedRange = normalizeDateRange(value);
            if (isMobile) {
                return (
                    <MobileDateRangeFilter
                        value={normalizedRange}
                        onChange={onChange}
                    />
                );
            }
            return (
                <DateRangeFilter
                    config={config}
                    value={normalizedRange}
                    onChange={onChange}
                />
            );
        }

        default:
            return null;
    }
}
