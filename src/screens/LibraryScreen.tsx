import React, { useEffect, useState } from "react";
import { Text, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookCard } from "../components/BookCard";
import { LibraryHeader } from "../components/LibraryHeader";
import { Book } from "../types/book";
import { fetchBooks } from "../data/mock-books";

type Props = {
    onOpenBook: (book: Book) => void;
};

type Section = { title: string; data: Book[][]; }; // data dikelompokkan per 2 (numColumns)

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

export function LibraryScreen({ onOpenBook }: Props) {

    const [sections, setSections] = useState<Section[]>([]);

    useEffect(() => {
        fetchBooks().then((books) => setSections(groupByCategory(books)));
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-story-bg" edges={["top"]}>
            <LibraryHeader />
            <SectionList
                sections={sections}
                keyExtractor={(row, i) => row.map((b) => b.id).join("-") + i}
                contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
                renderSectionHeader={({ section }) => (
                    <Text className="text-story-ink font-extrabold text-lg mt-4 mb-2 px-1">
                        {section.title}
                    </Text>
                )}
                renderItem={({ item: row }) => (
                    <>
                        {row.map((book, index) => (
                            <BookCard key={book.id} book={book} index={index} onPress={onOpenBook} />
                        ))}
                    </>
                )}
            />
        </SafeAreaView>
    );
}