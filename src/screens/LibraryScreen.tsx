import React, { useEffect, useState } from "react";
import { SectionList, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import Animated, { FadeIn } from "react-native-reanimated";
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
    const insets = useSafeAreaInsets();
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks()
            .then((books) => setSections(groupByCategory(books)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        ScreenOrientation.unlockAsync();
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    return (
        // PENTING: flex lewat style, BUKAN className
        <SafeAreaView
            style={{ flex: 1 }}
            className="bg-story-bg dark:bg-story-bg-dark"
            edges={["top", "bottom"]}
        >
            <LibraryHeader />
            <PlayfulBackground />

            {loading && (
                <Animated.View
                    entering={FadeIn}
                    style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                >
                    <Text style={{ fontSize: 48 }}>📚</Text>
                    <Text className="text-story-ink font-bold mt-3">Menyiapkan cerita...</Text>
                </Animated.View>
            )}

            {!loading && sections.length === 0 && (
                <View
                    style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}
                >
                    <Text style={{ fontSize: 48 }}>🦉</Text>
                    <Text className="text-story-ink font-bold mt-3 text-center">
                        Belum ada buku nih. Coba lagi nanti ya!
                    </Text>
                </View>
            )}

            {!loading && sections.length > 0 && (
                <SectionList
                    sections={sections}
                    keyExtractor={(row, i) => row.map((b) => b.id).join("-") + i}
                    style={{ flex: 1, backgroundColor: "transparent" }}
                    contentContainerStyle={{
                        paddingHorizontal: 10,
                        paddingBottom: insets.bottom + 32,
                    }}
                    showsVerticalScrollIndicator={false}
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
            )}
        </SafeAreaView>
    );
}