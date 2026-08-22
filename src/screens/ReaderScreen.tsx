import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, Dimensions, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { File, Directory, Paths } from "expo-file-system";
import * as ScreenOrientation from "expo-screen-orientation";
import Pdf from "react-native-pdf";
import { Book } from "../types/book";
import { ReaderControls } from "../components/ReaderControls";
import { ParentalLockButton } from "../components/ParentalLockButton";
import { CelebrationOverlay } from "../components/CelebrationOverlay";

type Props = {
    book: Book;
    onClose: () => void;
    onOpenSettings: () => void;
};

function filenameFromUrl(url: string): string {
    const segments = url.split("/");
    return segments[segments.length - 1] || `book-${Date.now()}.pdf`;
}

export function ReaderScreen({ book, onClose, onOpenSettings }: Props) {
    const [uri, setUri] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationShown, setCelebrationShown] = useState(false);

    const initialWindow = Dimensions.get("window");
    const [dimensions, setDimensions] = useState({
        width: initialWindow.width,
        height: initialWindow.height,
    });
    const isLandscape = dimensions.width > dimensions.height;
    const pdfScale = isLandscape ? 0.9 : 1;

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

                const filename = filenameFromUrl(book.pdfUrl);
                const localFile = new File(destination, filename);

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
                console.log("DOWNLOAD ERROR:", e);
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

    useEffect(() => {
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            onClose();
            return true;
        });
        return () => subscription.remove();
    }, [onClose]);

    useEffect(() => {
        ScreenOrientation.unlockAsync();
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    useEffect(() => {
        const sub = Dimensions.addEventListener("change", ({ window }) => {
            setDimensions({ width: window.width, height: window.height });
        });
        return () => sub.remove();
    }, []);

    useEffect(() => {
        if (numPages > 0 && page === numPages && !celebrationShown) {
            setShowCelebration(true);
            setCelebrationShown(true);
        }
    }, [page, numPages, celebrationShown]);

    return (
        <SafeAreaView className="flex-1 bg-[#1F6F63]" edges={["top", "bottom"]}>
            <View style={{ flex: 1, minHeight: dimensions.height }}>
                {error && (
                    <View className="flex-1 items-center justify-center px-8">
                        <Text style={{ fontSize: 48 }}>🦉</Text>
                        <Text className="text-white text-center text-base mt-3 mb-4">{error}</Text>
                        <Text
                            onPress={onClose}
                            className="text-story-ink bg-story-sun font-extrabold px-6 py-3 rounded-full overflow-hidden"
                        >
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
                            minScale={isLandscape ? 0.6 : 1}
                            maxScale={3}
                            enableDoubleTapZoom={false}
                            onLoadComplete={(total) => setNumPages(total)}
                            onPageChanged={(p) => setPage(p)}
                            onScaleChanged={(scale) => setIsZoomed(scale > 1.02)}
                            onError={(err) => console.log("PDF ERROR:", err)}
                            style={{ flex: 1, backgroundColor: "#D99730" }}
                        />

                        <ReaderControls page={page} numPages={numPages} onClose={onClose} />

                        <View className="absolute bottom-6 left-6">
                            <ParentalLockButton onUnlock={onOpenSettings} />
                        </View>

                        {showCelebration && (
                            <CelebrationOverlay onClose={() => setShowCelebration(false)} />
                        )}
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}