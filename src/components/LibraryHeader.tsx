import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { ParentalLockButton } from "./ParentalLockButton";

type Props = {
    onOpenSettings: () => void;
    locked?: boolean;
};

export function LibraryHeader({ onOpenSettings, locked = false }: Props) {
    const wiggle = useSharedValue(0);

    useEffect(() => {
        wiggle.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 700 }),
                withTiming(-1, { duration: 700 }),
                withTiming(0, { duration: 700 })
            ),
            -1,
            false
        );
    }, []);

    const mascotStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${wiggle.value * 12}deg` }],
    }));

    return (
        <View
            className="rounded-b-[28px] px-4 pt-2 pb-3 overflow-hidden border-[3px] border-story-cream bg-story-mustard shadow-sm"
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <View className="rounded-full w-11 h-11 items-center justify-center border-[3px] border-story-cream-soft bg-story-mustard-light shadow-sm">
                        <Animated.Text style={[{ fontSize: 24 }, mascotStyle]}>🦉</Animated.Text>
                    </View>
                    <View>
                        <Text
                            className="text-story-cream"
                            style={{ fontFamily: "Baloo2_700Bold", fontSize: 20 }}
                        >
                            Halo, teman Maca!
                        </Text>
                        <Text
                            className="text-story-cream-soft"
                            style={{ fontFamily: "Baloo2_500Medium", fontSize: 12 }}
                        >
                            Yuk pilih cerita seru hari ini
                        </Text>
                    </View>
                </View>

                <View className="items-end">
                    <ParentalLockButton onUnlock={onOpenSettings} locked={locked} />
                </View>
            </View>
        </View>
    );
}