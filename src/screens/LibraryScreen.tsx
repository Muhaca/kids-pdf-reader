import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { FadeIn } from "react-native-reanimated";
import { BookCard } from "../components/BookCard";
import { LibraryHeader } from "../components/LibraryHeader";
import { CategorySectionHeader } from "../components/CategorySectionHeader";
import { CategoryShelf } from "../components/CategoryShelf";
import { PlayfulBackground } from "../components/PlayfulBackground";
import { OnboardingOverlay } from "../components/OnboardingOverlay";
import { fetchBooks } from "../data/mock-books";
import { getAllProgress, getItem, readManifestCache, setItem } from "../services/storage";
import { Book } from "../types/book";

const ONBOARDING_KEY = "hasSeenOnboarding";

type ShelfRow =
    | { type: "chips" }
    | { type: "continue"; books: Book[] }
    | { type: "category"; title: string; books: Book[] };

function chunkRows(items: Book[]): Book[][] {
    const rows: Book[][] = [];
    for (let i = 0; i < items.length; i += 2) {
        rows.push(items.slice(i, i + 2));
    }
    return rows;
}

function LibraryScreenImpl({
    onOpenBook,
    onOpenSettings,
    locked = false,
}: {
    onOpenBook: (book: Book) => void;
    onOpenSettings: () => void;
    locked?: boolean;
}) {
    const insets = useSafeAreaInsets();
    const listRef = useRef<FlatList<ShelfRow>>(null);

    const cachedBooks = useMemo(() => readManifestCache()?.books, []);
    const initialProgress = useMemo(() => getAllProgress(), []);
    const initialBooks = (cachedBooks ?? []).map((b) => ({
        ...b,
        progress: initialProgress[b.id] ?? b.progress ?? 0,
    }));
    const [books, setBooks] = useState<Book[]>(initialBooks);
    const [continueBooks, setContinueBooks] = useState<Book[]>(() =>
        initialBooks.filter((b) => {
            const p = b.progress ?? 0;
            return p > 0 && p < 1;
        })
    );
    const [loading, setLoading] = useState(cachedBooks === undefined);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [bgReady, setBgReady] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setBgReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        if (getItem(ONBOARDING_KEY) !== "1") {
            setShowOnboarding(true);
        }
    }, []);

    useEffect(() => {
        fetchBooks()
            .then((fetched) => {
                const progress = getAllProgress();
                const merged = fetched.map((b) => ({
                    ...b,
                    progress: progress[b.id] ?? b.progress ?? 0,
                }));
                setBooks((prev) =>
                    prev.length === merged.length &&
                    prev.every((pb, i) => pb.id === merged[i].id)
                        ? prev
                        : merged
                );
                setContinueBooks(
                    merged.filter((b) => {
                        const p = progress[b.id] ?? 0;
                        return p > 0 && p < 1;
                    })
                );
            })
            .finally(() => setLoading(false));
    }, []);

    const grouped = useMemo(() => {
        const map = new Map<string, Book[]>();
        books.forEach((b) => {
            const key = b.category ?? "Lainnya";
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(b);
        });
        return map;
    }, [books]);

    const categoryList = useMemo(() => Array.from(grouped.keys()), [grouped]);

    const rows = useMemo<ShelfRow[]>(() => {
        const list: ShelfRow[] = [{ type: "chips" }];
        if (continueBooks.length) list.push({ type: "continue", books: continueBooks });
        categoryList.forEach((title) => {
            list.push({ type: "category", title, books: grouped.get(title) ?? [] });
        });
        return list;
    }, [categoryList, grouped, continueBooks]);

    const rowIndexOf = (title: string) => rows.findIndex((r) => r.type === "category" && r.title === title);

    const scrollToCategory = (title: string) => {
        const idx = rowIndexOf(title);
        if (idx < 0) return;
        listRef.current?.scrollToIndex({ index: idx, animated: true });
    };

    useEffect(() => {
        ScreenOrientation.unlockAsync();
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    const backToAll = () => setSelectedCategory(null);

    return (
        // PENTING: flex lewat style, BUKAN className
        <SafeAreaView
            style={{ flex: 1 }}
            className="bg-story-bg dark:bg-story-bg-dark"
            edges={["top", "bottom"]}
        >
            <LibraryHeader onOpenHelp={() => setShowOnboarding(true)} onOpenSettings={onOpenSettings} locked={locked} />
            {bgReady && <PlayfulBackground />}

            {loading && (
                <Animated.View
                    entering={FadeIn}
                    style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                >
                    <Text style={{ fontSize: 48 }}>📚</Text>
                    <Text className="text-story-ink dark:text-story-ink-dark font-bold mt-3">Menyiapkan cerita...</Text>
                </Animated.View>
            )}

            {!loading && books.length === 0 && (
                <View
                    style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}
                >
                    <Text style={{ fontSize: 48 }}>🦉</Text>
                    <Text className="text-story-ink dark:text-story-ink-dark font-bold mt-3 text-center">
                        Belum ada buku nih. Coba lagi nanti ya!
                    </Text>
                </View>
            )}

            {!loading && books.length > 0 && !selectedCategory && (
                <FlatList
                    ref={listRef}
                    data={rows}
                    keyExtractor={(item, i) => `${item.type}-${i}`}
                    stickyHeaderIndices={[0]}
                    style={{ flex: 1, backgroundColor: "transparent" }}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
                    showsVerticalScrollIndicator={false}
                    onScrollToIndexFailed={(info) => {
                        listRef.current?.scrollToOffset({
                            offset: info.averageItemLength * info.index,
                            animated: true,
                        });
                    }}
                    renderItem={({ item }) => {
                        if (item.type === "chips") {
                            return (
                                <CategoryChips
                                    titles={["Semua", ...categoryList]}
                                    onSelect={(t) => {
                                        if (t === "Semua") {
                                            listRef.current?.scrollToOffset({ offset: 0, animated: true });
                                        } else {
                                            scrollToCategory(t);
                                        }
                                    }}
                                />
                            );
                        }
                        if (item.type === "continue") {
                            return <ContinueRow books={item.books} onOpenBook={onOpenBook} />;
                        }
                        return (
                            <CategoryShelf
                                title={item.title}
                                index={rowIndexOf(item.title)}
                                count={item.books.length}
                                books={item.books}
                                onOpenBook={onOpenBook}
                                onPress={() => setSelectedCategory(item.title)}
                            />
                        );
                    }}
                />
            )}

            {!loading && books.length > 0 && selectedCategory && (
                <CategoryGrid
                    category={selectedCategory}
                    books={grouped.get(selectedCategory) ?? []}
                    onBack={backToAll}
                    onOpenBook={onOpenBook}
                />
            )}

            {showOnboarding && (
                <OnboardingOverlay
                    onClose={() => {
                        setItem(ONBOARDING_KEY, "1");
                        setShowOnboarding(false);
                    }}
                />
            )}
        </SafeAreaView>
    );
}

export const LibraryScreen = memo(LibraryScreenImpl);

type ChipsProps = {
    titles: string[];
    onSelect: (title: string) => void;
};

function CategoryChips({ titles, onSelect }: ChipsProps) {
    return (
        <View className="bg-story-bg dark:bg-story-bg-dark py-2">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}
            >
                {titles.map((t) => (
                    <Pressable
                        key={t}
                        onPress={() => onSelect(t)}
                        className="bg-white/70 dark:bg-white/15 px-4 py-2 rounded-full border-2 border-story-cream"
                    >
                        <Text className="text-story-ink dark:text-story-ink-dark font-bold text-sm">{t}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

function ContinueRow({ books, onOpenBook }: { books: Book[]; onOpenBook: (b: Book) => void }) {
    return (
        <View className="mb-4">
            <CategorySectionHeader title="Lanjutkan Baca" index={0} />
            <FlatList
                data={books}
                keyExtractor={(b) => b.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ paddingHorizontal: 10, paddingRight: 64 }}
                snapToInterval={172}
                decelerationRate="fast"
                renderItem={({ item }) => (
                    <Pressable onPress={() => onOpenBook(item)} style={{ width: 160, marginRight: 12 }}>
                        <View
                            style={{ backgroundColor: item.accent }}
                            className="aspect-4/5 rounded-2xl overflow-hidden items-center justify-center border-2 border-story-cream shadow-sm"
                        >
                            {item.coverUrl ? (
                                <Image
                                    source={{ uri: item.coverUrl }}
                                    style={{ width: "100%", height: "100%" }}
                                    contentFit="cover"
                                    transition={300}
                                />
                            ) : (
                                <Text style={{ fontSize: 48 }}>{item.emoji ?? "📖"}</Text>
                            )}
                            <View className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1">
                                <Text className="text-white font-bold text-[10px]">
                                    {Math.round(item.progress * 100)}% • Lanjutkan
                                </Text>
                            </View>
                        </View>
                        <Text
                            numberOfLines={2}
                            className="text-story-ink dark:text-story-ink-dark text-center mt-1.5 text-xs leading-4"
                            style={{ fontFamily: "Baloo2_700Bold" }}
                        >
                            {item.title}
                        </Text>
                    </Pressable>
                )}
            />
        </View>
    );
}

type GridProps = {
    category: string;
    books: Book[];
    onBack: () => void;
    onOpenBook: (b: Book) => void;
};

function CategoryGrid({ category, books, onBack, onOpenBook }: GridProps) {
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();

    return (
        <View style={{ flex: 1 }} className="px-2">
            <Pressable
                onPress={onBack}
                accessibilityRole="button"
                className="flex-row items-center gap-1 self-start mt-1 mb-1 py-2 pr-3"
                hitSlop={8}
            >
                <Ionicons name="chevron-back" size={22} color={scheme === "dark" ? "#EFE2C9" : "#362820"} />
                <Text className="text-story-ink dark:text-story-ink-dark font-bold text-base">Semua kategori</Text>
            </Pressable>
            <CategorySectionHeader title={category} index={0} count={books.length} />
            <FlatList
                data={chunkRows(books)}
                keyExtractor={(row, i) => i + "-" + row.map((b) => b.id).join("-")}
                contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: row, index }) => (
                    <View style={{ flexDirection: "row" }}>
                        {row.map((book, i) => (
                            <BookCard key={book.id} book={book} index={index * 2 + i} onPress={onOpenBook} />
                        ))}
                        {row.length === 1 && <View className="w-1/2" />}
                    </View>
                )}
            />
        </View>
    );
}