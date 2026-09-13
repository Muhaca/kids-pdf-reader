import React, { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    cancelAnimation,
} from "react-native-reanimated";

type Props = {
    onUnlock: () => void;
    locked?: boolean;
};

const HOLD_DURATION = 1500;
const SUN = "#FFC857";
const TEAL = "#1F6F63";

export function ParentalLockButton({ onUnlock, locked = false }: Props) {
    const progress = useSharedValue(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + progress.value * 0.4 }],
        opacity: 0.35 + progress.value * 0.4,
    }));

    useEffect(
        () => () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        },
        []
    );

    const handlePressIn = () => {
        if (locked) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        progress.value = withTiming(1, { duration: HOLD_DURATION });
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            onUnlock();
        }, HOLD_DURATION);
    };

    const handlePressOut = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        cancelAnimation(progress);
        progress.value = withTiming(0, { duration: 200 });
    };

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ zIndex: 20, elevation: 20 }}>
            <View className="w-11 h-11 items-center justify-center">
                <Animated.View
                    style={[ringStyle, { backgroundColor: SUN }]}
                    className="absolute w-11 h-11 rounded-full"
                />
                <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: locked ? TEAL : "rgba(0,0,0,0.5)" }}
                >
                    <Text style={{ fontSize: 16 }}>🔒</Text>
                </View>
            </View>
        </Pressable>
    );
}