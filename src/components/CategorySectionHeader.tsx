import { Text, View } from "react-native";

const ACCENT_ROTATION = ["#FFC857", "#FF6B6B", "#4CAF7D", "#6C5CE7", "#3E7CB1", "#FF8FA3"];

const CATEGORY_ICONS: Record<string, string> = {
    kebiasaan: "🌱",
    "dongeng nusantara": "🏯",
    edukasi: "🎓",
    petualangan: "🗺️",
};

function getCategoryIcon(title: string) {
    return CATEGORY_ICONS[title.toLowerCase()] ?? "📚";
}

type Props = {
    title: string;
    index: number;
};

export function CategorySectionHeader({ title, index }: Props) {
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
            </View>
        </View>
    );
}