import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const CONFETTI = ["🎉", "⭐", "🎊", "✨", "🏆", "🌈"];

export function CelebrationOverlay({ onClose }: { onClose: () => void; }) {
    const bounce = useSharedValue(0);

    useEffect(() => {
        bounce.value = withRepeat(
            withSequence(
                withTiming(-14, { duration: 400 }),
                withTiming(0, { duration: 400 })
            ),
            -1,
            true
        );
    }, []);

    const bounceStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bounce.value }],
    }));

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(43,34,80,0.85)",
            }}
            className="items-center justify-center px-8"
        >
            <View className="flex-row flex-wrap justify-center mb-4" style={{ maxWidth: 220 }}>
                {CONFETTI.map((e, i) => (
                    <Text key={i} style={{ fontSize: 28, margin: 4 }}>{e}</Text>
                ))}
            </View>

            <Animated.Text style={[{ fontSize: 56 }, bounceStyle]}>🦉</Animated.Text>

            <Text className="text-white font-extrabold text-2xl text-center mt-3">
                Selesai! Kamu hebat!
            </Text>
            <Text className="text-white/80 text-center mt-1">
                Cerita ini sudah kamu baca sampai habis 🎉
            </Text>

            <Pressable
                onPress={onClose}
                className="bg-story-sun rounded-full px-8 py-3 mt-6 shadow-md"
            >
                <Text className="text-story-ink font-extrabold text-base">Lanjut Baca</Text>
            </Pressable>
        </Animated.View>
    );
}