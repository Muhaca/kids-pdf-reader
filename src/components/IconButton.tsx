import { Pressable, StyleSheet, useColorScheme } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
    name: keyof typeof Ionicons.glyphMap;
    accessibilityLabel: string;
    onPress?: () => void;
    disabled?: boolean;
    size?: number;
    /** Lewati `color` untuk memakai warna tema (ink / ink-dark). */
    color?: string;
    className?: string;
};

export function IconButton({
    name,
    accessibilityLabel,
    onPress,
    disabled = false,
    size = 26,
    color,
    className = "",
}: Props) {
    const scheme = useColorScheme();
    const themed = scheme === "dark" ? "#EFE2C9" : "#362820";

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className={`items-center justify-center rounded-full min-w-11 min-h-11 ${className}`}
            style={[{ zIndex: 20, elevation: 20 }, styles.base, disabled && styles.disabled]}
        >
            <Ionicons name={name} size={size} color={color ?? themed} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    disabled: {
        opacity: 0.35,
    },
});