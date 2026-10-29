import type { ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@cnma/react-ui';
import { cn } from '@/lib/utils';

/** Shared neutral treatment for account, conversation, and user-picker avatars. */
export function UserAvatar({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <Avatar className={cn('size-8 shrink-0 rounded-full border border-foreground/15 text-xs', className)}>
            <AvatarFallback className="bg-foreground/10 text-foreground font-semibold">{children}</AvatarFallback>
        </Avatar>
    );
}
