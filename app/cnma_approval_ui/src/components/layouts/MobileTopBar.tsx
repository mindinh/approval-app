import { cn } from '@/lib/utils';
import { isWorkZone } from '@/utils/launchpad';
import { AccountMenu } from './AccountMenu';

interface MobileTopBarProps {
    title?: string;
    className?: string;
}

export function MobileTopBar({ title, className }: MobileTopBarProps) {
    if (isWorkZone()) return null;
    return (
        <div className={cn('flex items-center justify-between gap-2 shrink-0', 'mobile-page-header border-b border-border bg-card px-3', className)}>
            {title && <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>}
            <AccountMenu />
        </div>
    );
}
