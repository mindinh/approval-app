import { useEffect, useState } from 'react';

/** Refresh relative day labels at local midnight and after a backgrounded mobile tab resumes. */
export function useCommentToday() {
    const [today, setToday] = useState(() => new Date());

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const schedule = () => {
            clearTimeout(timer);
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            timer = setTimeout(refresh, midnight.getTime() - now.getTime());
        };
        const refresh = () => {
            setToday(new Date());
            schedule();
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') refresh();
        };

        schedule();
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    return today;
}
