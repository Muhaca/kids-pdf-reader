import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
} from "react-native-reanimated";

const DECORATIONS = [
    { emoji: "⭐", top: "5%", left: "8%", size: 20, rotate: "-15deg" },
    { emoji: "🌈", top: "2%", right: "8%", size: 30, rotate: "8deg" },
    { emoji: "☁️", top: "16%", left: "80%", size: 26, rotate: "0deg" },
    { emoji: "✨", top: "28%", left: "4%", size: 18, rotate: "10deg" },
    { emoji: "🎈", top: "42%", right: "5%", size: 24, rotate: "-8deg" },
    { emoji: "🦋", top: "56%", left: "8%", size: 20, rotate: "12deg" },
    { emoji: "⭐", top: "70%", right: "10%", size: 16, rotate: "20deg" },
    { emoji: "☁️", top: "84%", left: "45%", size: 22, rotate: "0deg" },
    { emoji: "✨", top: "94%", right: "20%", size: 16, rotate: "-10deg" },
];

const DOTS = Array.from({ length: 18 }).map((_, i) => ({
    top: `${(i * 37) % 100}%`,
    left: `${(i * 53) % 100}%`,
    size: i % 3 === 0 ? 5 : 3,
}));

function FloatingDecoration({ d, delay }: { d: (typeof DECORATIONS)[number]; delay: number; }) {
    const offset = useSharedValue(0);

    useEffect(() => {
        offset.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(-8, { duration: 1800 }),
                    withTiming(0, { duration: 1800 })
                ),
                -1,
                true
            )
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: offset.value }, { rotate: d.rotate }],
    }));

    return (
        <Animated.Text
            style={[
                {
                    position: "absolute",
                    top: d.top as any,
                    left: (d as any).left,
                    right: (d as any).right,
                    fontSize: d.size,
                    opacity: 0.18,
                },
                style,
            ]}
        >
            {d.emoji}
        </Animated.Text>
    );
}

export function PlayfulBackground() {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {DOTS.map((d, i) => (
                <View
                    key={i}
                    style={{
                        position: "absolute",
                        top: d.top as any,
                        left: d.left as any,
                        width: d.size,
                        height: d.size,
                        borderRadius: d.size / 2,
                        backgroundColor: "#D9643A",
                        opacity: 0.08,
                    }}
                />
            ))}
        </View>
    );
}