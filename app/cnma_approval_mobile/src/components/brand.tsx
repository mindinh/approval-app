import { Image } from 'expo-image';
import { View } from 'react-native';
import { spacing, useColors } from '@/theme';
import { ThemedText } from './themed-text';

/** The three blocks of the proconarum mark on a 32-unit grid (traced from the official favicon). */
const MARK_BLOCKS = [
    { x: 1, y: 5, w: 16, h: 12, r: 3 },
    { x: 20, y: 1, w: 11, h: 9, r: 2.5 },
    { x: 15, y: 18, w: 10, h: 13, r: 2.5 },
] as const;

const SAP_LOGO = require('../../assets/images/sap-logo.png');
/** Width / height of the cropped SAP logo artwork. */
const SAP_LOGO_RATIO = 410 / 210;

/** proconarum logo mark, drawn as vectors so it stays sharp at any size. */
export function ProconarumMark({ size = 48 }: { size?: number }) {
    const colors = useColors();
    const unit = size / 32;
    return (
        <View accessibilityRole="image" accessibilityLabel="proconarum" style={{ width: size, height: size }}>
            {MARK_BLOCKS.map((block) => (
                <View
                    key={`${block.x}-${block.y}`}
                    style={{
                        position: 'absolute',
                        left: block.x * unit,
                        top: block.y * unit,
                        width: block.w * unit,
                        height: block.h * unit,
                        borderRadius: block.r * unit,
                        borderCurve: 'continuous',
                        backgroundColor: colors.brand,
                    }}
                />
            ))}
        </View>
    );
}

/** Mark + "proconarum" wordmark, used as the app signature (sign-in). */
export function ProconarumLogo({ size = 56 }: { size?: number }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.smd }}>
            <ProconarumMark size={size} />
            <ThemedText style={{ fontSize: size * 0.5, fontWeight: '700', letterSpacing: -0.5 }}>proconarum</ThemedText>
        </View>
    );
}

/** Small "Powered by SAP" credit line. */
export function PoweredBySap({ height = 18 }: { height?: number }) {
    return (
        <View accessible accessibilityLabel="Powered by SAP" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
            <ThemedText variant="caption">Powered by</ThemedText>
            <Image source={SAP_LOGO} style={{ height, width: height * SAP_LOGO_RATIO }} contentFit="contain" />
        </View>
    );
}
