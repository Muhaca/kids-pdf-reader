import React, { useEffect, useState } from "react";
import { Dimensions, SectionList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { BookCard } from "../components/BookCard";
import { LibraryHeader } from "../components/LibraryHeader";
import { CategorySectionHeader } from "../components/CategorySectionHeader";
import { PlayfulBackground } from "../components/PlayfulBackground";
import { fetchBooks } from "../data/mock-books";
import { Book } from "../types/book";

type Section = { title: string; data: Book[][]; };

function groupByCategory(books: Book[]): Section[] {
    const map = new Map<string, Book[]>();
    books.forEach((b) => {
        const key = b.category ?? "Lainnya";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
    });

    return Array.from(map.entries()).map(([title, items]) => {
        const rows: Book[][] = [];
        for (let i = 0; i < items.length; i += 2) {
            rows.push(items.slice(i, i + 2));
        }
        return { title, data: rows };
    });
}

export function LibraryScreen({ onOpenBook }: { onOpenBook: (b: Book) => void; }) {
    const initialWindow = Dimensions.get("window");
    const [dimensions, setDimensions] = useState({
        width: initialWindow.width,
        height: initialWindow.height,
    });
    const [sections, setSections] = useState<Section[]>([]);


    useEffect(() => {
        fetchBooks().then((books) => setSections(groupByCategory(books)));
    }, []);

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
        <SafeAreaView className="flex-1 bg-story-bg" edges={["top"]}>
            <LibraryHeader />
            <PlayfulBackground />

            <View style={{ flex: 1, minHeight: dimensions.height }}>

                <SectionList
                    sections={sections}
                    keyExtractor={(row, i) => row.map((b) => b.id).join("-") + i}
                    style={{ backgroundColor: "transparent" }}
                    contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
                    renderSectionHeader={({ section }) => (
                        <CategorySectionHeader
                            title={section.title}
                            index={sections.findIndex((s) => s.title === section.title)}
                        />
                    )}
                    renderItem={({ item: row, index }) => (
                        <View style={{ flexDirection: "row" }}>
                            {row.map((book, i) => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    index={index * 2 + i}
                                    onPress={onOpenBook}
                                />
                            ))}
                            {row.length === 1 && <View className="w-1/2" />}
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}