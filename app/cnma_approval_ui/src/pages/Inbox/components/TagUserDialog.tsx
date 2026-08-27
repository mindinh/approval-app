import { useState, useEffect } from 'react';
import {
    Button,
    Input,
    Label,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Badge,
    Checkbox
} from '@cnma/react-ui';
import { useBusUsers } from '../hooks/useBusUsers';
import type { BusUser } from '@/services/inbox/inbox.types';
import { Search, UserCheck, Loader2, User, Mail, AtSign, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TagUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyTags: (selectedUsers: BusUser[]) => void;
    initialSelected?: BusUser[];
}

export function TagUserDialog({
    isOpen,
    onClose,
    onApplyTags,
    initialSelected = []
}: TagUserDialogProps) {
    const { t } = useTranslation();
    const { searchPattern, setSearchPattern, users, isLoading } = useBusUsers('', 250);
    const [selectedMap, setSelectedMap] = useState<Map<string, BusUser>>(new Map());

    useEffect(() => {
        if (isOpen) {
            const map = new Map<string, BusUser>();
            initialSelected.forEach((u) => {
                if (u.SAPUserName) {
                    map.set(u.SAPUserName, u);
                }
            });
            setSelectedMap(map);
            setSearchPattern('');
        }
    }, [isOpen, initialSelected]);

    const handleToggleUser = (user: BusUser) => {
        setSelectedMap((prev) => {
            const next = new Map(prev);
            if (next.has(user.SAPUserName)) {
                next.delete(user.SAPUserName);
            } else {
                next.set(user.SAPUserName, user);
            }
            return next;
        });
    };

    const handleRemoveTag = (sapUserName: string) => {
        setSelectedMap((prev) => {
            const next = new Map(prev);
            next.delete(sapUserName);
            return next;
        });
    };

    const handleConfirm = () => {
        onApplyTags(Array.from(selectedMap.values()));
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    const selectedList = Array.from(selectedMap.values());

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="w-[92vw] sm:max-w-lg max-h-[85dvh] my-auto flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <AtSign className="w-5 h-5 text-primary" />
                        {t('comments.tagUserTitle', 'Tag Users (CC)')}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {t('comments.tagUserDescription', 'Search and select users to mention or CC in this comment.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
                    {/* Search Bar */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('comments.searchLabel', 'Search Users')}</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                inputMode="search"
                                autoComplete="off"
                                placeholder={t('comments.searchPlaceholder', 'Search by name, SAP user, or email...')}
                                value={searchPattern}
                                onChange={(e) => setSearchPattern(e.target.value)}
                                className="pl-9 pr-8 h-11 sm:h-9 text-base"
                            />
                            {isLoading && (
                                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
                            )}
                        </div>

                        {/* Search Results List */}
                        <div className="mt-2 border rounded-md max-h-52 overflow-y-auto divide-y divide-border/40 bg-card shadow-sm">
                            {users.length > 0 ? (
                                users.map((user) => {
                                    const isSelected = selectedMap.has(user.SAPUserName);
                                    return (
                                        <div
                                            key={user.SAPUserName}
                                            onClick={() => handleToggleUser(user)}
                                            className={`p-2.5 min-h-[48px] cursor-pointer flex items-center justify-between transition-colors hover:bg-muted/50 active:bg-muted/70 ${
                                                isSelected ? 'bg-primary/5 border-l-4 border-primary' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggleUser(user)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs flex-shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-foreground truncate">
                                                        {user.FullName || `${user.FirstName} ${user.LastName}`}
                                                        <span className="text-xs text-muted-foreground font-normal ml-1.5">
                                                            ({user.SAPUserName})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                                                        <Mail className="w-3 h-3 shrink-0 text-muted-foreground/70" />
                                                        <span className="truncate">{user.EmailAddress || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && <UserCheck className="w-4 h-4 text-primary flex-shrink-0 ml-2" />}
                                        </div>
                                    );
                                })
                            ) : searchPattern.trim().length > 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    {isLoading ? t('common.loading', 'Loading...') : t('comments.noUsersFound', 'No users found matching query.')}
                                </div>
                            ) : (
                                <div className="p-3 text-center text-xs text-muted-foreground">
                                    {t('comments.typeToSearch', 'Type to search users by name, user ID, or email...')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Users Chips */}
                    {selectedList.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-border/40">
                            <Label className="text-xs font-medium text-muted-foreground">
                                {t('comments.selectedUsers', `Selected (${selectedList.length})`, { count: selectedList.length })}:
                            </Label>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                                {selectedList.map((u) => (
                                    <Badge
                                        key={u.SAPUserName}
                                        variant="secondary"
                                        className="flex items-center gap-1 text-xs py-1 px-2 font-normal bg-primary/10 text-primary border border-primary/20"
                                    >
                                        <span>@{u.FullName || u.SAPUserName}</span>
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:opacity-75 ml-0.5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag(u.SAPUserName);
                                            }}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="grid grid-cols-2 gap-3 pt-3 border-t sm:flex sm:justify-end sm:gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="h-11 sm:h-9 font-medium">
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        variant="action"
                        onClick={handleConfirm}
                        disabled={selectedList.length === 0 || isSubmitting}
                        className="h-11 sm:h-9 font-medium"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        {t('comments.applyTags', `Apply Tags (${selectedList.length})`, { count: selectedList.length })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
