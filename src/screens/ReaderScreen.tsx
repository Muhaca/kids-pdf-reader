import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, Dimensions, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { File, Directory, Paths } from "expo-file-system";
import * as ScreenOrientation from "expo-screen-orientation";
import Pdf from "react-native-pdf";
import { Book } from "../types/book";
import { ReaderControls } from "../components/ReaderControls";
import { ParentalLockButton } from "../components/ParentalLockButton";

type Props = {
    book: Book;
    onClose: () => void;
    onOpenSettings: () => void;
};

export function ReaderScreen({ book, onClose, onOpenSettings }: Props) {
    const [uri, setUri] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    const initialWindow = Dimensions.get("window");
    const [dimensions, setDimensions] = useState({
        width: initialWindow.width,
        height: initialWindow.height,
    });
    const isLandscape = dimensions.width > dimensions.height;
    const pdfScale = isLandscape ? 0.9 : 1;

    // download + cache PDF dari R2 (API baru expo-file-system)
    useEffect(() => {
        let mounted = true;

        async function resolveSource() {
            if (!book.pdfUrl) {
                setError("PDF untuk buku ini belum tersedia.");
                return;
            }

            try {
                const destination = new Directory(Paths.cache, "pdfs");
                destination.create({ intermediates: true, idempotent: true });

                const localFile = new File(destination, `book-${book.id}.pdf`);

                if (localFile.exists) {
                    if (mounted) setUri(localFile.uri);
                    return;
                }

                if (mounted) setIsDownloading(true);
                const output = await File.downloadFileAsync(book.pdfUrl, destination);

                if (mounted && output.exists) {
                    setUri(output.uri);
                }
            } catch (e) {
                if (mounted) setError("Gagal mengunduh PDF. Cek koneksi internet kamu.");
            } finally {
                if (mounted) setIsDownloading(false);
            }
        }

        resolveSource();
        return () => {
            mounted = false;
        };
    }, [book]);

    // tombol back fisik Android
    useEffect(() => {
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            onClose();
            return true;
        });
        return () => subscription.remove();
    }, [onClose]);

    // buka semua orientasi selama di Reader, kunci portrait lagi saat keluar
    useEffect(() => {
        ScreenOrientation.unlockAsync();
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    // pantau perubahan ukuran layar (rotate)
    useEffect(() => {
        const sub = Dimensions.addEventListener("change", ({ window }) => {
            setDimensions({ width: window.width, height: window.height });
        });
        return () => sub.remove();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-story-ink" edges={["top", "bottom"]}>
            <View style={{ flex: 1, minHeight: dimensions.height }}>
                {error && (
                    <View className="flex-1 items-center justify-center px-8">
                        <Text className="text-white text-center text-base mb-4">{error}</Text>
                        <Text onPress={onClose} className="text-story-sun font-bold">
                            Kembali ke koleksi
                        </Text>
                    </View>
                )}

                {!error && !uri && (
                    <View className="flex-1 items-center justify-center px-8">
                        <ActivityIndicator color="#FFC857" size="large" />
                        <Text className="text-white text-xs mt-3">
                            {isDownloading ? "Mengunduh buku..." : "Menyiapkan buku..."}
                        </Text>
                    </View>
                )}

                {!error && uri && (
                    <>
                        <Pdf
                            source={{ uri, cache: true }}
                            enablePaging={!isZoomed}
                            horizontal={!isZoomed}
                            fitPolicy={0}
                            spacing={0}
                            scale={pdfScale}
                            minScale={isLandscape ? 0.9 : 1}
                            maxScale={3}
                            enableDoubleTapZoom={true}
                            onLoadComplete={(total) => setNumPages(total)}
                            onPageChanged={(p) => setPage(p)}
                            onScaleChanged={(scale) => setIsZoomed(scale > 1.02)}
                            onError={(err) => console.log("PDF ERROR:", err)}
                            style={{ flex: 1, backgroundColor: "#2B2250" }}
                        />

                        <ReaderControls page={page} numPages={numPages} onClose={onClose} />

                        <View className="absolute bottom-6 left-6">
                            <ParentalLockButton onUnlock={onOpenSettings} />
                        </View>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}