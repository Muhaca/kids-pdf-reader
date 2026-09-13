import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { ParentalLockButton } from "./ParentalLockButton";

type Props = {
    onOpenHelp: () => void;
    onOpenSettings: () => void;
    locked?: boolean;
};

export function LibraryHeader({ onOpenHelp, onOpenSettings, locked = false }: Props) {
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
            className="rounded-b-[36px] px-5 pt-4 pb-7 overflow-hidden border-[3px] border-story-cream bg-story-mustard shadow-sm"
        >
            {/* aksen dot pattern, bukan sparkle emoji acak */}
            <View style={{ position: "absolute", top: 14, right: 24, flexDirection: "row", gap: 6 }}>
                <View className="w-1.5 h-1.5 rounded-full bg-story-mustard-light" />
                <View className="w-1.5 h-1.5 rounded-full bg-story-coral" />
                <View className="w-1.5 h-1.5 rounded-full bg-story-cream-soft" />
            </View>

            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <View className="rounded-full w-14 h-14 items-center justify-center border-[3px] border-story-cream-soft bg-story-mustard-light shadow-sm">
                        <Animated.Text style={[{ fontSize: 28 }, mascotStyle]}>🦉</Animated.Text>
                    </View>
                    <View>
                        <Text
                            className="text-story-cream"
                            style={{ fontFamily: "Baloo2_700Bold", fontSize: 24 }}
                        >
                            Halo, teman Maca!
                        </Text>
                        <Text
                            className="text-story-cream-soft"
                            style={{ fontFamily: "Baloo2_500Medium", fontSize: 13 }}
                        >
                            Yuk pilih cerita seru hari ini
                        </Text>
                    </View>
                </View>

                <View className="flex-col items-end gap-2">
                    <ParentalLockButton onUnlock={onOpenSettings} locked={locked} />
                    <Pressable
                        onPress={onOpenHelp}
                        accessibilityRole="button"
                        accessibilityLabel="Bantuan"
                        className="rounded-full w-9 h-9 items-center justify-center bg-black/25"
                    >
                        <Text className="text-white font-extrabold" style={{ fontSize: 16 }}>
                            ?
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}