import { useEffect, useState } from "react";
import { BackHandler, Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";

const SUN = "#FFC857";
const FEEDBACK_EMAIL = "buku@kemendikdasmen.go.id";
const ORIGIN_HOSTS = ["budi.kemendikdasmen.go.id", "static-sc.cloudapp.web.id"];

type Props = {
    visible: boolean;
    kidMode: boolean;
    onToggleKidMode: (next: boolean) => void;
    onClose: () => void;
};

export function ParentSettingsModal({ visible, kidMode, onToggleKidMode, onClose }: Props) {
    const [showAbout, setShowAbout] = useState(false);

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
            <View
                className="w-full max-w-[400px] bg-story-cream rounded-3xl border-[3px] border-story-coral"
                style={{ maxHeight: "88%" }}
            >
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 8 }}>
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
                            lewat tahan tombol Back + Recents bersamaan lalu masukkan PIN
                            perangkat.
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => setShowAbout((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel="Tentang sumber buku"
                        accessibilityState={{ expanded: showAbout }}
                        className="flex-row items-center justify-between bg-story-bg rounded-2xl px-4 py-3 mt-4"
                    >
                        <Text className="text-story-ink font-bold text-sm">
                            Tentang sumber buku
                        </Text>
                        <Text className="text-story-ink/50 text-xs">{showAbout ? "▲" : "▼"}</Text>
                    </Pressable>

                    {showAbout && (
                        <View className="rounded-2xl bg-story-bg/70 px-4 py-3 -mt-2 pt-4">
                            <Text className="text-story-ink text-xs leading-5">
                                Buku-buku ini milik pemerintah dan penerbit. Isinya diambil
                                langsung dari server resmi{" "}
                                {ORIGIN_HOSTS.map((host, i) => (
                                    <Text key={host} className="font-bold">
                                        {i > 0 ? ", " : ""}
                                        {host}
                                    </Text>
                                ))}{" "}
                                saat kamu membuka bukunya — tidak disimpan, tidak disalin, dan tidak
                                dipakai untuk komersial.
                            </Text>

                            <View className="flex-row flex-wrap gap-2 mt-3">
                                <View className="bg-story-sun/40 rounded-full px-3 py-1">
                                    <Text className="text-story-ink text-[10px] font-bold">
                                        NON-KOMERSIAL
                                    </Text>
                                </View>
                                <View className="bg-story-bg rounded-full px-3 py-1">
                                    <Text className="text-story-ink/70 text-[10px] font-bold">
                                        BUKAN MIRROR
                                    </Text>
                                </View>
                                <View className="bg-story-bg rounded-full px-3 py-1">
                                    <Text className="text-story-ink/70 text-[10px] font-bold">
                                        TANPA IKLAN
                                    </Text>
                                </View>
                            </View>

                            <Text className="text-story-ink/60 text-[11px] leading-5 mt-3">
                                279 buku. Setiap PDF diunduh satu per satu saat dibuka, lalu
                                dilepas otomatis kalau penyimpanan perangkat penuh.
                            </Text>

                            <Pressable
                                onPress={() =>
                                    Linking.openURL(
                                        `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
                                            "Maca - laporan buku bermasalah"
                                        )}&body=${encodeURIComponent(
                                            "Buku: \nMasalah: \nTautan: "
                                        )}`
                                    ).catch(() => {})
                                }
                                accessibilityRole="button"
                                className="mt-3 bg-story-sun rounded-full py-2 items-center"
                            >
                                <Text className="text-story-ink text-xs font-extrabold">
                                    Laporkan buku bermasalah
                                </Text>
                            </Pressable>
                            <Text className="text-story-ink/50 text-[10px] mt-1 text-center">
                                {FEEDBACK_EMAIL}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
                    <Pressable
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="Tutup pengaturan"
                        className="bg-story-sun rounded-full px-8 py-3 self-center shadow-md"
                    >
                        <Text className="text-story-ink font-extrabold">Selesai</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}
