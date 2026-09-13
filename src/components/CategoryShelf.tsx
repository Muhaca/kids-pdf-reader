import React from "react";
import { FlatList, Pressable, View } from "react-native";
import { Book } from "../types/book";
import { BookCard } from "./BookCard";
import { CategorySectionHeader } from "./CategorySectionHeader";

type Props = {
    title: string;
    index: number;
    count?: number;
    books: Book[];
    onOpenBook: (book: Book) => void;
    onPress?: () => void;
};

export function CategoryShelf({ title, index, count, books, onOpenBook, onPress }: Props) {
    const header = <CategorySectionHeader title={title} index={index} count={count} />;

    return (
        <View className="mb-4">
            {onPress ? (
                <Pressable onPress={onPress} hitSlop={6}>
                    {header}
                </Pressable>
            ) : (
                header
            )}
            <FlatList
                data={books}
                keyExtractor={(b) => b.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ paddingHorizontal: 10, paddingRight: 64 }}
                renderItem={({ item, index: i }) => (
                    <View style={{ width: 128, marginRight: 12 }}>
                        <BookCard book={item} index={i} onPress={onOpenBook} compact />
                    </View>
                )}
            />
        </View>
    );
}