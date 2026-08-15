import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, Dimensions, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Asset } from "expo-asset";
import Pdf from "react-native-pdf";
import { Book } from "../types/book";
import { ReaderControls } from "../components/ReaderControls";
import { ParentalLockButton } from "../components/ParentalLockButton";
import * as ScreenOrientation from "expo-screen-orientation";

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

    const initialWindow = Dimensions.get("window");
    const [dimensions, setDimensions] = useState({
        width: initialWindow.width,
        height: initialWindow.height,
    });

    const isLandscape = dimensions.width > dimensions.height;
    const pdfScale = isLandscape ? 0.9 : 1.3;

    useEffect(() => {
        let mounted = true;

        async function resolveSource() {
            if (!book.pdfSource) {
                setError("PDF untuk buku ini belum tersedia.");
                return;
            }
            try {
                const asset = Asset.fromModule(book.pdfSource);
                await asset.downloadAsync();
                if (mounted && asset.localUri) {
                    setUri(asset.localUri);
                }
            } catch {
                setError("Gagal memuat PDF.");
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
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#FFC857" size="large" />
                    </View>
                )}

                {!error && uri && (
                    <>
                        <Pdf
                            source={{ uri, cache: true }}
                            page={page}
                            enablePaging={true}
                            horizontal={true}
                            fitPolicy={0}
                            spacing={0}
                            scale={pdfScale}
                            minScale={isLandscape ? 0.9 : 1}
                            maxScale={3}
                            enableDoubleTapZoom={true}
                            onLoadComplete={(total) => setNumPages(total)}
                            onPageChanged={(p) => setPage(p)}
                            onError={(err) => console.log("PDF ERROR:", err)}
                            style={{ flex: 1, backgroundColor: "#2B2250" }}
                        />

                        <ReaderControls
                            page={page}
                            numPages={numPages}
                            onClose={onClose}
                        />

                        <View className="absolute bottom-6 left-6">
                            <ParentalLockButton onUnlock={onOpenSettings} />
                        </View>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}