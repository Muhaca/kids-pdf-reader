import { useEffect } from "react";
import { BackHandler, Pressable, Switch, Text, View } from "react-native";

const SUN = "#FFC857";

type Props = {
    visible: boolean;
    kidMode: boolean;
    onToggleKidMode: (next: boolean) => void;
    onClose: () => void;
};

export function ParentSettingsModal({ visible, kidMode, onToggleKidMode, onClose }: Props) {
    useEffect(() => {
        if (!visible) return;
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            onClose();
            return true;
        });
        return () => sub.remove();
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <View
            className="flex-1 bg-[#221B14]/95 items-center justify-center px-6"
            style={{ position: "absolute", inset: 0, zIndex: 1000, elevation: 10 }}
        >
            <View className="w-full max-w-[400px] bg-story-cream rounded-3xl p-6 shadow-lg border-[3px] border-story-coral">
                <Text className="text-story-ink font-extrabold text-xl text-center">
                    Area Orang Tua
                </Text>
                <Text className="text-story-ink/70 text-center mt-1 text-sm">
                    Mode Anak mengunci aplikasi agar si kecil tidak bisa keluar.
                </Text>

                <View className="flex-row items-center justify-between bg-story-bg rounded-2xl px-4 py-3 mt-5">
                    <View className="flex-1 pr-3">
                        <Text className="text-story-ink font-bold text-base">🔒 Mode Anak</Text>
                        <Text className="text-story-ink/60 text-xs mt-0.5">
                            {kidMode
                                ? "Aktif — aplikasi terkunci saat dibuka"
                                : "Nonaktif — aplikasi terbuka normal"}
                        </Text>
                    </View>
                    <Switch
                        value={kidMode}
                        onValueChange={onToggleKidMode}
                        trackColor={{ false: "#D9C9A8", true: SUN }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <View className="rounded-2xl bg-story-bg/70 px-4 py-3 mt-4">
                    <Text className="text-story-ink font-bold text-sm">Tips keamanan</Text>
                    <Text className="text-story-ink/70 text-xs leading-5 mt-1">
                        Wajib: aktifkan PIN/pattern layar di Settings HP sebelum memakai Mode
                        Anak. Tanpa PIN, anak bisa keluar bebas. Saat terkunci, keluar hanya
                        lewat tahan tombol Back + Recents bersamaan lalu masukkan PIN perangkat.
                    </Text>
                </View>

                <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Tutup pengaturan"
                    className="bg-story-sun rounded-full px-8 py-3 mt-6 self-center shadow-md"
                >
                    <Text className="text-story-ink font-extrabold">Selesai</Text>
                </Pressable>
            </View>
        </View>
    );
}