import { background, listRowBackground, scrollContentBackground } from '@expo/ui/swift-ui/modifiers';
import type { ThemeColors } from '@/theme';

/** SwiftUI Form on the app's grouped background (instead of the system one), so it matches the other screens. */
export const formModifiers = (colors: ThemeColors) => [scrollContentBackground('hidden'), background(colors.groupedBackground)];

/** Row surface of the app's card color. */
export const rowModifiers = (colors: ThemeColors) => [listRowBackground(colors.cardBackground)];
