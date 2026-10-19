import type { ReactNode } from 'react';
import {
    AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
    AlertDialogDescription, AlertDialogFooter, Separator,
} from '@cnma/react-ui';
import { AlertTriangle } from 'lucide-react';

interface StatusDialogProps {
    open: boolean;
    title: string;
    description: string;
    tone?: 'warning' | 'destructive';
    detail?: ReactNode;
    actions: ReactNode;
}

/** Shared session/startup dialog: library modal behavior, application theme tokens. */
export function StatusDialog({ open, title, description, tone = 'destructive', detail, actions }: StatusDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="status-dialog__content">
                <AlertDialogHeader className="status-dialog__header">
                    <AlertDialogTitle className="status-dialog__title">
                        <AlertTriangle aria-hidden className={tone === 'warning' ? 'status-dialog__icon status-dialog__icon--warning' : 'status-dialog__icon'} />
                        {title}
                    </AlertDialogTitle>
                    <Separator />
                    <AlertDialogDescription className="status-dialog__description">
                        {description}
                    </AlertDialogDescription>
                    {detail}
                </AlertDialogHeader>
                <AlertDialogFooter className="status-dialog__footer">
                    {actions}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
