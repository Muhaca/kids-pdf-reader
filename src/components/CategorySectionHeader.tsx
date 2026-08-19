import { Text, View } from "react-native";

const ACCENT_ROTATION = ["#FFC857", "#FF6B6B", "#4CAF7D", "#6C5CE7", "#3E7CB1"];

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
        <View className="flex-row items-center mt-6 mb-3 px-1">
            <View
                style={{ backgroundColor: accent }}
                className="w-8 h-8 rounded-full items-center justify-center mr-2 border-2 border-white shadow-sm"
            >
                <Text style={{ fontSize: 15 }}>{icon}</Text>
            </View>
            <Text className="text-story-ink font-extrabold text-lg">{title}</Text>
        </View>
    );
}