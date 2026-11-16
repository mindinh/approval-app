import type { ListItemProps } from '@expo/ui';
import type { ThemeColors } from '@/theme';

type ModifierConfig = NonNullable<ListItemProps['modifiers']>[number];

// Android (Compose) colors come from the `style` / `colors` props instead; SwiftUI modifiers live in styles.ios.ts.
export const formModifiers = (_colors: ThemeColors): ModifierConfig[] => [];
export const rowModifiers = (_colors: ThemeColors): ModifierConfig[] => [];
