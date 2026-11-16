import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

/** Whether the device has a network connection (NetInfo, fed into TanStack's onlineManager at the root). */
export function useIsOnline(): boolean {
    return useSyncExternalStore(
        (onChange) => onlineManager.subscribe(onChange),
        () => onlineManager.isOnline(),
        () => true
    );
}
