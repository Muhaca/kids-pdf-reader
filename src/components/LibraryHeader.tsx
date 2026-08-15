import { Text, View } from "react-native";

export function LibraryHeader() {
    return (
        <View className="bg-story-sky rounded-b-[40px] px-5 pt-4 pb-6 shadow-lg">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    <View className="bg-white rounded-full w-12 h-12 items-center justify-center">
                        <Text style={{ fontSize: 26 }}>🦉</Text>
                    </View>
                    <View>
                        <Text className="text-white font-extrabold text-xl">
                            Koleksi Dongeng
                        </Text>
                        <Text className="text-white/80 text-xs font-medium">
                            Perpustakaan Digital Anak
                        </Text>
                    </View>
                </View>

                <View className="bg-white/20 rounded-full w-10 h-10 items-center justify-center">
                    <Text style={{ fontSize: 18 }}>📖</Text>
                </View>
            </View>
        </View>
    );
}