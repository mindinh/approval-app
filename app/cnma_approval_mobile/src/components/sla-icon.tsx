import { memo } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * SLA "expression" face of an open task, same artwork as the web `SlaIcons.tsx`: a smiling face while
 * the task is under five days old, a worried face with a sweat drop once it is overdue. The faces keep
 * their own light fill in dark mode too, so they read as stickers on any surface.
 */
export const SlaIcon = memo(function SlaIcon({ isOverdue, size = 24 }: { isOverdue: boolean; size?: number }) {
    return isOverdue ? (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" accessibilityRole="image" accessibilityLabel="Pending more than 5 days, overdue">
            <Circle cx={32} cy={32} r={27} fill="#FFF4F4" stroke="#DC5A5A" strokeWidth={3} />
            <Path d="M19 22.5C21.2 21.2 23.3 20.8 25.4 21.4" stroke="#8F3030" strokeWidth={2.8} strokeLinecap="round" />
            <Path d="M38.6 21.4C40.7 20.8 42.8 21.2 45 22.5" stroke="#8F3030" strokeWidth={2.8} strokeLinecap="round" />
            <Circle cx={23} cy={28} r={2.5} fill="#8F3030" />
            <Circle cx={41} cy={28} r={2.5} fill="#8F3030" />
            <Path d="M22 42C24.9 38.2 28.2 36.7 32 36.7C35.8 36.7 39.1 38.2 42 42" stroke="#8F3030" strokeWidth={3.2} strokeLinecap="round" />
            <Path d="M45.5 33.5C45.5 33.5 49 37.7 49 40.3C49 42.2 47.6 43.6 45.5 43.6C43.4 43.6 42 42.2 42 40.3C42 37.7 45.5 33.5 45.5 33.5Z" fill="#60A5FA" />
        </Svg>
    ) : (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" accessibilityRole="image" accessibilityLabel="New task, less than 5 days">
            <Circle cx={32} cy={32} r={27} fill="#ECFDF3" stroke="#16A34A" strokeWidth={3} />
            <Circle cx={23} cy={27} r={2.5} fill="#166534" />
            <Circle cx={41} cy={27} r={2.5} fill="#166534" />
            <Path d="M22 37C24.8 41.2 28.2 43 32 43C35.8 43 39.2 41.2 42 37" stroke="#166534" strokeWidth={3.2} strokeLinecap="round" />
        </Svg>
    );
});
