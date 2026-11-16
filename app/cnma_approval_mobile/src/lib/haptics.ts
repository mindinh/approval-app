/**
 * Haptic vocabulary of the app. One haptic per user action, fired in the same frame as its visual,
 * never as the only feedback (haptics are often off or silent).
 */
import * as Haptics from 'expo-haptics';

const ignore = () => {};

export const haptics = {
    /** A user-started action begins (pull to refresh, opening a sheet). */
    light: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore),
    /** A value ticks to another option (segment, picker). */
    selection: () => void Haptics.selectionAsync().catch(ignore),
    success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore),
    error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(ignore),
};
