import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@cnma/react-ui';
import { FileQuestion, ArrowLeft, Home, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6 bg-muted/30">
            <Card className="max-w-md w-full border-border/60 shadow-md bg-white overflow-hidden text-center">
                <CardContent className="p-6 sm:p-8 space-y-6 flex flex-col items-center">
                    <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <FileQuestion className="size-10 stroke-[1.75]" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">404</h1>
                        <h2 className="text-xl font-bold text-foreground">
                            {t('error.pageNotFound', 'Page Not Found')}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                            {t('error.pageNotFoundDescription', 'The page or resource you are looking for does not exist or has been moved.')}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate('/')}
                            className="w-full sm:w-auto gap-2 font-semibold text-xs h-10 px-4"
                        >
                            <Home className="size-4" />
                            <span>{t('navigation.home', 'Go to Home')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/inbox')}
                            className="w-full sm:w-auto gap-2 text-xs h-10 px-4"
                        >
                            <Inbox className="size-4" />
                            <span>{t('navigation.inbox', 'Go to Inbox')}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto gap-2 text-xs h-10 px-4"
                        >
                            <ArrowLeft className="size-4" />
                            <span>{t('common.goBack', 'Go Back')}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
