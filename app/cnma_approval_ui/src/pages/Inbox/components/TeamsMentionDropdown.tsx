import { useState, useEffect, useRef } from 'react';
import { useBusUsers } from '../hooks/useBusUsers';
import type { BusUser } from '@/services/inbox/inbox.types';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TeamsMentionDropdownProps {
    isOpen: boolean;
    searchQuery: string;
    onSelectUser: (user: BusUser) => void;
    onClose: () => void;
}

export function TeamsMentionDropdown({
    isOpen,
    searchQuery,
    onSelectUser,
    onClose,
}: TeamsMentionDropdownProps) {
    const { t } = useTranslation();
    const { setSearchPattern, users, isLoading } = useBusUsers(searchQuery, 150);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchPattern(searchQuery);
        setSelectedIndex(0);
    }, [searchQuery, setSearchPattern]);

    // Click outside handler to dismiss dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Capture phase keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (users.length > 0 ? (prev + 1) % users.length : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (users.length > 0 ? (prev - 1 + users.length) % users.length : 0));
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (users.length > 0 && users[selectedIndex]) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectUser(users[selectedIndex]);
                }
            } else if (e.key === ' ' || e.code === 'Space') {
                if (users.length > 0 && users[selectedIndex]) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectUser(users[selectedIndex]);
                } else {
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, users, selectedIndex, onSelectUser, onClose]);

    useEffect(() => {
        if (listRef.current && listRef.current.children[selectedIndex]) {
            const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div
            ref={containerRef}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute bottom-full mb-1.5 left-0 w-72 sm:w-80 max-h-60 bg-card text-card-foreground border border-border/80 rounded-xl shadow-2xl z-50 animate-in fade-in-50 slide-in-from-bottom-2 duration-150 flex flex-col overflow-hidden pointer-events-auto"
        >
            {/* Header */}
            <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 bg-muted/30 flex items-center justify-between shrink-0 select-none">
                <span>{t('comments.suggestions', 'Suggestions')}</span>
                {isLoading && <Loader2 className="size-3 animate-spin text-primary" />}
            </div>

            {/* User List */}
            <div
                ref={listRef}
                onWheel={(e) => e.stopPropagation()}
                className="overflow-y-auto max-h-48 divide-y divide-border/20 p-1 pointer-events-auto touch-auto"
            >
                {users.length > 0 ? (
                    users.map((user, idx) => {
                        const isSelected = idx === selectedIndex;
                        const fullName = user.FullName || `${user.FirstName || ''} ${user.LastName || ''}`.trim() || user.SAPUserName;
                        const initials = getInitials(fullName);

                        return (
                            <div
                                key={user.SAPUserName}
                                onClick={() => onSelectUser(user)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`px-2.5 py-2 rounded-md cursor-pointer flex items-center gap-2.5 transition-colors ${
                                    isSelected
                                        ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                                        : 'hover:bg-muted/50 text-foreground'
                                }`}
                            >
                                {/* Teams circular avatar */}
                                <div className="size-7 rounded-full bg-gradient-to-br from-primary/80 to-primary text-primary-foreground flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm">
                                    {initials}
                                </div>

                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-semibold text-xs truncate leading-tight">
                                        {fullName}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate leading-snug">
                                        {user.EmailAddress || user.SAPUserName}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                        {isLoading
                            ? t('common.loading', 'Loading suggestions...')
                            : t('comments.noUsersFound', 'No matching users found')}
                    </div>
                )}
            </div>
        </div>
    );
}

