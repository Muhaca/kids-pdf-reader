import { Text, View } from "react-native";

const ACCENT_ROTATION = ["#FFC857", "#FF6B6B", "#4CAF7D", "#6C5CE7", "#3E7CB1", "#FF8FA3"];

const CATEGORY_ICONS: Record<string, string> = {
    kebiasaan: "🌱",
    keluarga: "👨‍👩‍👧",
    pertemanan: "🤝",
    hewan: "🦊",
    "alam & lingkungan": "🌳",
    petualangan: "🗺️",
    "dongeng & legenda": "🏯",
    "dongeng nusantara": "🏯",
    "edukasi & sains": "🎓",
    edukasi: "🎓",
    makanan: "🍰",
    "puisi & sastra": "📜",
    "karakter & emosi": "💛",
    remaja: "🌟",
};

function getCategoryIcon(title: string) {
    return CATEGORY_ICONS[title.toLowerCase()] ?? "📚";
}

type Props = {
    title: string;
    index: number;
    count?: number;
};

export function CategorySectionHeader({ title, index, count }: Props) {
    const accent = ACCENT_ROTATION[index % ACCENT_ROTATION.length];
    const icon = getCategoryIcon(title);

    return (
        <View className="flex-row items-center mt-7 mb-3 px-1">
            <View
                style={{ backgroundColor: accent }}
                className="flex-row items-center rounded-full pl-1.5 pr-4 py-1.5 shadow-sm border-2 border-story-cream"
            >
                <View className="w-7 h-7 rounded-full bg-white/90 items-center justify-center mr-2">
                    <Text style={{ fontSize: 14 }}>{icon}</Text>
                </View>
                <Text className="text-white font-extrabold text-base">{title}</Text>
                {count !== undefined && (
                    <View className="ml-2 bg-white/25 rounded-full px-2 py-0.5">
                        <Text className="text-white font-bold text-xs">{count}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}