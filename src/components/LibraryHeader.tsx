import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

export function LibraryHeader() {
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
            style={{ backgroundColor: "#D99730", borderColor: "#FBF6EA" }}
            className="rounded-b-[36px] px-5 pt-4 pb-7 overflow-hidden border-[3px] shadow-sm"
        >
            {/* aksen dot pattern, bukan sparkle emoji acak */}
            <View style={{ position: "absolute", top: 14, right: 24, flexDirection: "row", gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#E8A33D" }} />
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#D9643A" }} />
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#F5E8CE" }} />
            </View>

            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <View
                        style={{ backgroundColor: "#E8A33D", borderColor: "#F5E8CE" }}
                        className="rounded-full w-14 h-14 items-center justify-center border-[3px] shadow-sm"
                    >
                        <Animated.Text style={[{ fontSize: 28 }, mascotStyle]}>🦉</Animated.Text>
                    </View>
                    <View>
                        <Text
                            style={{ fontFamily: "Baloo2_700Bold", color: "#FBF3E3", fontSize: 24 }}
                        >
                            Halo, teman kecil!
                        </Text>
                        <Text
                            style={{ fontFamily: "Baloo2_500Medium", color: "#F5E8CE", fontSize: 13 }}
                        >
                            Yuk pilih cerita seru hari ini
                        </Text>
                    </View>
                </View>

                <View
                    style={{ backgroundColor: "#D9643A" }}
                    className="rounded-full w-11 h-11 items-center justify-center"
                >
                    <Text style={{ fontSize: 18 }}>📖</Text>
                </View>
            </View>
        </View>
    );
}