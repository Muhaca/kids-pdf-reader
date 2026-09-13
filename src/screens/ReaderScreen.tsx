import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Dimensions, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import Pdf, { PdfRef } from "react-native-pdf";
import { Book } from "../types/book";
import { usePdfLoader } from "../hooks/usePdfLoader";
import { useReadAloud } from "../hooks/useReadAloud";
import { setProgress } from "../services/storage";
import { ReaderControls } from "../components/ReaderControls";
import { CelebrationOverlay } from "../components/CelebrationOverlay";
import { IconButton } from "../components/IconButton";

type Props = {
    book: Book;
    onClose: () => void;
};

export function ReaderScreen({ book, onClose }: Props) {
    const { uri, error, isDownloading } = usePdfLoader(book);
    const pdfRef = useRef<PdfRef>(null);

    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationShown, setCelebrationShown] = useState(false);

    const [dimensions, setDimensions] = useState(() => {
        const { width, height } = Dimensions.get("window");
        return { width, height };
    });

    const isMixed = Boolean(book.mixedPages);
    const pageText = book.story?.[page - 1] ?? null;
    const hasReadAloud = Boolean(book.story?.length);
    const { isReading, toggle } = useReadAloud(hasReadAloud ? pageText : null);

    const pageRef = useRef(page);
    const numPagesRef = useRef(numPages);
    useEffect(() => {
        pageRef.current = page;
    }, [page]);
    useEffect(() => {
        numPagesRef.current = numPages;
    }, [numPages]);

    useEffect(() => {
        if (numPages <= 0) return;
        const id = setTimeout(() => setProgress(book.id, page / numPages), 500);
        return () => clearTimeout(id);
    }, [page, numPages, book.id]);

    useEffect(() => {
        return () => {
            if (numPagesRef.current > 0) setProgress(book.id, pageRef.current / numPagesRef.current);
        };
    }, [book.id]);

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

    const goTo = (target: number) => {
        const next = Math.min(Math.max(target, 1), numPages || 1);
        pdfRef.current?.setPage(next);
    };

    return (
        <SafeAreaView className="flex-1 bg-story-forest" edges={["top", "bottom"]}>
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
                            ref={pdfRef}
                            source={{ uri, cache: true }}
                            // PENTING: enablePaging/horizontal/fitPolicy dibuat KONSTAN.
                            // Mengubahnya saat runtime memicu restart render PDF native (drawPdf).
                            enablePaging={!isMixed}
                            horizontal
                            fitPolicy={isMixed ? 2 : 0}
                            spacing={0}
                            scale={1}
                            minScale={1}
                            maxScale={3}
                            enableDoubleTapZoom={false}
                            onLoadComplete={(total) => setNumPages(total)}
                            onPageChanged={(p) => setPage((cur) => (cur === p ? cur : p))}
                            onError={(err) => console.log("PDF ERROR:", err)}
                            style={{ flex: 1, backgroundColor: "#D99730" }}
                        />

                        <ReaderControls page={page} numPages={numPages} onClose={onClose} />

                        {isMixed && (
                            <PageNav
                                page={page}
                                numPages={numPages}
                                onPrev={() => goTo(page - 1)}
                                onNext={() => goTo(page + 1)}
                            />
                        )}

                        {hasReadAloud && (
                            <PressableReadAloud active={isReading} onPress={toggle} />
                        )}

                        {showCelebration && (
                            <CelebrationOverlay onClose={() => setShowCelebration(false)} />
                        )}
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

function PageNav({
    page,
    numPages,
    onPrev,
    onNext,
}: {
    page: number;
    numPages: number;
    onPrev: () => void;
    onNext: () => void;
}) {
    return (
        <View className="absolute bottom-8 self-center flex-row items-center gap-5">
            <IconButton
                name="chevron-back"
                accessibilityLabel="Halaman sebelumnya"
                disabled={page <= 1}
                onPress={onPrev}
                color="#FBF6EA"
                size={30}
                className="w-14 h-14 bg-black/45"
            />
            <IconButton
                name="chevron-forward"
                accessibilityLabel="Halaman berikutnya"
                disabled={numPages > 0 && page >= numPages}
                onPress={onNext}
                color="#FBF6EA"
                size={30}
                className="w-14 h-14 bg-black/45"
            />
        </View>
    );
}

function PressableReadAloud({ active, onPress }: { active: boolean; onPress: () => void }) {
    return (
        <IconButton
            name={active ? "volume-high" : "volume-mute"}
            accessibilityLabel={active ? "Hentikan bacaan" : "Bacakan buku"}
            onPress={onPress}
            size={30}
            color={active ? "#362820" : "#FBF6EA"}
            className={`absolute bottom-6 right-6 w-14 h-14 ${active ? "bg-story-cream" : "bg-black/45"}`}
        />
    );
}