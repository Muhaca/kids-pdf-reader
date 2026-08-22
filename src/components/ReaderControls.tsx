import { Pressable, Text, View } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
    page: number;
    numPages: number;
    onClose: () => void;
};

export function ReaderControls({ page, numPages, onClose }: Props) {
    const pct = numPages > 0 ? Math.min(100, Math.round((page / numPages) * 100)) : 0;

    return (
        <>
            <Pressable
                onPress={onClose}
                className="absolute top-4 left-4 bg-black/40 rounded-full w-11 h-11 items-center justify-center"
            >
                <Ionicons name="arrow-back-circle" size={40} color="white" />
            </Pressable>

            <View className="absolute top-4 self-center bg-white/90 rounded-full pl-3 pr-4 py-2 flex-row items-center shadow-md">
                <Text style={{ fontSize: 14, marginRight: 6 }}>📖</Text>
                <View
                    style={{
                        width: 110,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "#2B225022",
                        overflow: "hidden",
                        marginRight: 8,
                    }}
                >
                    <View
                        style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: 999,
                            backgroundColor: "#FFC857",
                        }}
                    />
                </View>
                <Text className="text-story-ink text-xs font-extrabold">
                    {page} / {numPages || "-"}
                </Text>
            </View>
        </>
    );
}