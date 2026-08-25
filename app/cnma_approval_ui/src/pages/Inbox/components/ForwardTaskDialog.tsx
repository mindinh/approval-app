import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
    Button,
    Textarea,
    Input,
    Label,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@cnma/react-ui';
import { useSearchUsers } from '../hooks/useSearchUsers';
import type { UserSearchResult } from '@/services/inbox/inbox.types';
import { Search, UserCheck, Loader2, User, Mail, Forward } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForwardTaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onForward: (forwardTo: string, comment?: string) => void;
    isSubmitting: boolean;
    taskTitle?: string;
}

export function ForwardTaskDialog({
    isOpen,
    onClose,
    onForward,
    isSubmitting,
    taskTitle
}: ForwardTaskDialogProps) {
    const { t } = useTranslation();
    const { searchPattern, setSearchPattern, users, isLoading } = useSearchUsers('', 250);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [comment, setComment] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Reset state whenever the dialog is opened
    useEffect(() => {
        if (isOpen) {
            setSelectedUser(null);
            setSearchPattern('');
            setComment('');
            setHighlightedIndex(0);
        }
    }, [isOpen, setSearchPattern]);

    // Keep highlighted index within bounds when user list updates
    useEffect(() => {
        setHighlightedIndex(0);
    }, [users]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (listRef.current && users.length > 0) {
            const itemEl = listRef.current.children[highlightedIndex] as HTMLElement;
            if (itemEl) {
                itemEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, users]);

    const handleUserSelect = (user: UserSearchResult) => {
        setSelectedUser(user);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (users.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.min(prev + 1, users.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (users[highlightedIndex]) {
                handleUserSelect(users[highlightedIndex]);
            }
        }
    };

    const handleConfirm = () => {
        if (!selectedUser) return;
        onForward(selectedUser.userId || selectedUser.uniqueName || '', comment.trim());
    };

    const handleClose = () => {
        setSelectedUser(null);
        setSearchPattern('');
        setComment('');
        setHighlightedIndex(0);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="w-[92vw] sm:max-w-lg max-h-[85dvh] my-auto flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Forward className="w-5 h-5 text-primary" />
                        {t('forward.title', 'Forward Task')}
                    </DialogTitle>
                    <DialogDescription>
                        {taskTitle
                            ? t('forward.descriptionWithTitle', `Forward "${taskTitle}" to another recipient.`, { title: taskTitle })
                            : t('forward.description', 'Select a target user to forward this task to.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
                    {/* User Search Section */}
                    <div className="space-y-2">
                        <Label>{t('forward.searchLabel', 'Search Recipient')}</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                inputMode="search"
                                autoComplete="off"
                                placeholder={t('forward.searchPlaceholder', 'Search by name, user ID, or email...')}
                                value={searchPattern}
                                onChange={(e) => setSearchPattern(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pl-9 pr-8 h-11 sm:h-9 text-base"
                            />
                            {isLoading && (
                                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
                            )}
                        </div>

                        {/* Search Results Dropdown / List */}
                        <div
                            ref={listRef}
                            className="mt-2 border border-border rounded-md max-h-48 overflow-y-auto divide-y divide-border/60 bg-card shadow-xs"
                        >
                            {users.length > 0 ? (
                                users.map((user, idx) => {
                                    const isSelected = selectedUser?.userId === user.userId;
                                    const isHighlighted = idx === highlightedIndex;
                                    return (
                                        <div
                                            key={user.userId || user.uniqueName}
                                            onClick={() => handleUserSelect(user)}
                                            onMouseEnter={() => setHighlightedIndex(idx)}
                                            className={`p-2.5 min-h-[48px] cursor-pointer flex items-center justify-between transition-colors ${
                                                isSelected
                                                    ? 'bg-primary/10 border-l-4 border-primary font-medium text-foreground'
                                                    : isHighlighted
                                                    ? 'bg-muted/80'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-xs shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-foreground truncate">
                                                        {user.displayName} <span className="text-xs text-muted-foreground font-normal">({user.userId || user.uniqueName})</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                        <span className="flex items-center gap-1 truncate">
                                                            <Mail className="w-3 h-3 text-muted-foreground" />
                                                            {user.email || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && <UserCheck className="w-5 h-5 text-primary shrink-0 ml-2" />}
                                        </div>
                                    );
                                })
                            ) : searchPattern.trim().length > 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    {isLoading ? t('common.loading', 'Loading...') : t('forward.noUsersFound', 'No users found matching query.')}
                                </div>
                            ) : (
                                <div className="p-3 text-center text-xs text-muted-foreground">
                                    {t('forward.typeToSearch', 'Type to search recipient users...')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected User Summary Badge */}
                    {selectedUser && (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-sm font-medium text-foreground">
                                    {t('forward.selectedUser', `Selected: ${selectedUser.displayName} (${selectedUser.userId})`, { name: selectedUser.displayName, id: selectedUser.userId })}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(null)}
                                className="h-8 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                            >
                                {t('forward.changeUser', 'Change')}
                            </Button>
                        </div>
                    )}

                    {/* Optional Note Field */}
                    <div className="space-y-1.5">
                        <Label htmlFor="forward-note">
                            {t('forward.noteLabel', 'Optional Note')}
                        </Label>
                        <Textarea
                            id="forward-note"
                            placeholder={t('forward.notePlaceholder', 'Add an optional comment for the recipient...')}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="resize-none text-base sm:text-sm"
                        />
                    </div>
                </div>

                <DialogFooter className="grid grid-cols-2 gap-3 pt-3 border-t sm:flex sm:justify-end sm:gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="h-11 sm:h-9 font-medium">
                        {t('forward.cancel', 'Cancel')}
                    </Button>
                    <Button
                        variant="action"
                        onClick={handleConfirm}
                        disabled={!selectedUser || isSubmitting}
                        className="h-11 sm:h-9 font-medium"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('forward.submitting', 'Forwarding...')}
                            </>
                        ) : (
                            <>
                                <Forward className="w-4 h-4 mr-2" />
                                {t('forward.submit', 'Forward Task')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


