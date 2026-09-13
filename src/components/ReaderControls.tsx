import { Text, View } from "react-native";
import { IconButton } from "./IconButton";

type Props = {
    page: number;
    numPages: number;
    onClose: () => void;
};

export function ReaderControls({ page, numPages, onClose }: Props) {
    const pct = numPages > 0 ? Math.min(100, Math.round((page / numPages) * 100)) : 0;

    return (
        <>
            <IconButton
                name="arrow-back-circle"
                accessibilityLabel="Tutup buku"
                onPress={onClose}
                color="#FFFFFF"
                size={28}
                className="absolute top-4 left-4 bg-black/40 w-12 h-12"
            />

            <View className="absolute top-4 self-center bg-white/90 rounded-full pl-3 pr-4 py-2 flex-row items-center shadow-md">
                <Text style={{ fontSize: 14, marginRight: 6 }}>📖</Text>
                <View
                    className="bg-story-ink/10"
                    style={{
                        width: 110,
                        height: 8,
                        borderRadius: 999,
                        overflow: "hidden",
                        marginRight: 8,
                    }}
                >
                    <View
                        className="bg-story-sun"
                        style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: 999,
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