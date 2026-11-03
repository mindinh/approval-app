import { useEffect, useState } from 'react';

/** Search input state plus its trimmed value, published after `debounceMs` of inactivity. */
export function useDebouncedPattern(initialPattern: string, debounceMs: number) {
    const [searchPattern, setSearchPattern] = useState(initialPattern);
    const [debouncedPattern, setDebouncedPattern] = useState(initialPattern);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedPattern(searchPattern.trim());
        }, debounceMs);

        return () => clearTimeout(handler);
    }, [searchPattern, debounceMs]);

    return { searchPattern, setSearchPattern, debouncedPattern };
}
