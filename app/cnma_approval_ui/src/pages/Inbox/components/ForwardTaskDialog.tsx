import { useState } from 'react';
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

    const handleUserSelect = (user: UserSearchResult) => {
        setSelectedUser(user);
    };

    const handleConfirm = () => {
        if (!selectedUser) return;
        onForward(selectedUser.userId || selectedUser.uniqueName || '', comment.trim());
    };

    const handleClose = () => {
        setSelectedUser(null);
        setSearchPattern('');
        setComment('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Forward className="w-5 h-5 text-blue-600" />
                        {t('forward.title', 'Forward Task')}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        {taskTitle
                            ? t('forward.descriptionWithTitle', `Forward "${taskTitle}" to another recipient.`, { title: taskTitle })
                            : t('forward.description', 'Select a target user to forward this task to.')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
                    {/* User Search Section */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('forward.searchLabel', 'Search Recipient')}</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder={t('forward.searchPlaceholder', 'Search by name, user ID, or email...')}
                                value={searchPattern}
                                onChange={(e) => setSearchPattern(e.target.value)}
                                className="pl-9 pr-8"
                            />
                            {isLoading && (
                                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-blue-500" />
                            )}
                        </div>

                        {/* Search Results Dropdown / List */}
                        <div className="mt-2 border rounded-md max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white shadow-sm">
                            {users.length > 0 ? (
                                users.map((user) => {
                                    const isSelected = selectedUser?.userId === user.userId;
                                    return (
                                        <div
                                            key={user.userId || user.uniqueName}
                                            onClick={() => handleUserSelect(user)}
                                            className={`p-2.5 cursor-pointer flex items-center justify-between transition-colors hover:bg-blue-50/60 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-xs flex-shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                        {user.displayName} <span className="text-xs text-gray-500 font-normal">({user.userId || user.uniqueName})</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                        <span className="flex items-center gap-1 truncate">
                                                            <Mail className="w-3 h-3 text-gray-400" />
                                                            {user.email || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && <UserCheck className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />}
                                        </div>
                                    );
                                })
                            ) : searchPattern.trim().length > 0 ? (
                                <div className="p-4 text-center text-xs text-gray-500">
                                    {isLoading ? t('common.loading', 'Loading...') : t('forward.noUsersFound', 'No users found matching query.')}
                                </div>
                            ) : (
                                <div className="p-3 text-center text-xs text-gray-400">
                                    {t('forward.typeToSearch', 'Type to search recipient users...')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected User Summary Badge */}
                    {selectedUser && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                    {t('forward.selectedUser', `Selected: ${selectedUser.displayName} (${selectedUser.userId})`, { name: selectedUser.displayName, id: selectedUser.userId })}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(null)}
                                className="h-6 px-2 text-xs text-blue-700 hover:text-blue-900"
                            >
                                {t('forward.changeUser', 'Change')}
                            </Button>
                        </div>
                    )}

                    {/* Optional Note Field */}
                    <div className="space-y-1.5">
                        <Label htmlFor="forward-note" className="text-sm font-medium text-gray-700">
                            {t('forward.noteLabel', 'Optional Note')}
                        </Label>
                        <Textarea
                            id="forward-note"
                            placeholder={t('forward.notePlaceholder', 'Add an optional comment for the recipient...')}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="pt-3 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        {t('forward.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedUser || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
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

