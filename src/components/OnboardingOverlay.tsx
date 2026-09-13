import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const STEPS = [
    {
        emoji: "📚",
        title: "Pilih cerita kesukaanmu",
        body: "Ketuk salah satu kartu buku untuk membuka dan mulai membawanya.",
    },
    {
        emoji: "📖",
        title: "Baca cerita",
        body: "Geser halaman ke kiri untuk membuka cerita.",
    },
    {
        emoji: "🔒",
        title: "Area orang tua",
        body: "Tahan tombol kunci di pojok kanan atas selama 1,5 detik untuk membuka pengaturan orang tua.",
    },
];

export function OnboardingOverlay({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState(0);
    const isLast = step === STEPS.length - 1;

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={{ position: "absolute", inset: 0 }}
            className="items-center justify-center"
        >
            <View className="flex-1 w-full bg-[#221B14]/95 items-center justify-center px-8">

                <Text style={{ fontSize: 72 }}>{STEPS[step].emoji}</Text>
                <Text className="text-story-cream font-extrabold text-2xl text-center mt-4">
                    {STEPS[step].title}
                </Text>
                <Text className="text-story-cream-soft text-center mt-2 px-4 leading-5">
                    {STEPS[step].body}
                </Text>

                <View className="flex-row gap-2 mt-7">
                    {STEPS.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: i === step ? 22 : 10,
                                height: 10,
                                borderRadius: 5,
                                opacity: i === step ? 1 : 0.35,
                            }}
                            className={i === step ? "bg-story-sun" : "bg-story-cream-soft"}
                        />
                    ))}
                </View>

                <Pressable
                    onPress={() => (isLast ? onClose() : setStep((s) => s + 1))}
                    accessibilityRole="button"
                    accessibilityLabel={isLast ? "Ayo mulai" : "Lanjut"}
                    className="bg-story-sun rounded-full px-10 py-4 mt-8 shadow-md"
                >
                    <Text className="text-story-ink font-extrabold text-lg">
                        {isLast ? "Ayo mulai!" : "Lanjut"}
                    </Text>
                </Pressable>
            </View>
        </Animated.View>
    );
}