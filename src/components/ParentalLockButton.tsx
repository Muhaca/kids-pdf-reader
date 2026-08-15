import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    cancelAnimation,
    runOnJS,
} from "react-native-reanimated";

type Props = {
    onUnlock: () => void;
};

const HOLD_DURATION = 3000;

export function ParentalLockButton({ onUnlock }: Props) {
    const progress = useSharedValue(0);
    const [holding, setHolding] = useState(false);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + progress.value * 0.4 }],
        opacity: 0.35 + progress.value * 0.4,
    }));

    const handlePressIn = () => {
        setHolding(true);
        progress.value = withTiming(1, { duration: HOLD_DURATION }, (finished) => {
            if (finished) runOnJS(onUnlock)();
        });
    };

    const handlePressOut = () => {
        setHolding(false);
        cancelAnimation(progress);
        progress.value = withTiming(0, { duration: 200 });
    };

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ zIndex: 20, elevation: 20 }}>
            <View className="w-12 h-12 items-center justify-center">
                <Animated.View
                    style={ringStyle}
                    className="absolute w-12 h-12 rounded-full bg-story-sun"
                />
                <View className="w-11 h-11 rounded-full bg-black/50 items-center justify-center">
                    <Text style={{ fontSize: 18 }}>🔒</Text>
                </View>
            </View>
            {holding && (
                <Text className="text-white text-[10px] text-center mt-1 font-semibold">
                    Tahan...
                </Text>
            )}
        </Pressable>
    );
}