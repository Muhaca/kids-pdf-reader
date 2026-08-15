import React from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookCard } from "../components/BookCard";
import { LibraryHeader } from "../components/LibraryHeader";
import { mockBooks } from "../data/mock-books";
import { Book } from "../types/book";

type Props = {
    onOpenBook: (book: Book) => void;
};

export function LibraryScreen({ onOpenBook }: Props) {
    return (
        <SafeAreaView className="flex-1 bg-story-bg" edges={["top"]}>
            <LibraryHeader />
            <FlatList
                data={mockBooks}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
                renderItem={({ item, index }) => (
                    <BookCard book={item} index={index} onPress={onOpenBook} />
                )}
            />
        </SafeAreaView>
    );
}