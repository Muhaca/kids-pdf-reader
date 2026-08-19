import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    FadeInDown,
} from "react-native-reanimated";
import { Book } from "../types/book";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
    book: Book;
    index: number;
    onPress: (book: Book) => void;
};

export function BookCard({ book, index, onPress }: Props) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const filledDots = Math.round(book.progress * 5);
    const isFinished = book.progress >= 1;
    const rotateDeg = index % 2 === 0 ? "-1.5deg" : "1.5deg";

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 70).springify()}
            className="w-1/2 p-2"
        >
            <AnimatedPressable
                style={animatedStyle}
                onPressIn={() => (scale.value = withSpring(0.95))}
                onPressOut={() => (scale.value = withSpring(1))}
                onPress={() => onPress(book)}
            >
                <View
                    style={{ backgroundColor: book.accent }}
                    className="aspect-4/5 rounded-[28px] overflow-hidden items-center justify-center border-4 border-white shadow-md"
                >
                    {book.coverUrl ? (
                        <Image
                            source={{ uri: book.coverUrl }}
                            style={{ width: "100%", height: "100%", color: book.accent }}
                            contentFit="cover"
                            transition={300}
                        />
                    ) : (
                        <Text style={{ fontSize: 52 }}>{book.emoji ?? "📖"}</Text>
                    )}

                    {isFinished && (
                        <View className="absolute top-2 right-2 bg-black/40 rounded-full px-2 py-1">
                            <Text style={{ fontSize: 10 }}>⭐</Text>
                        </View>
                    )}
                </View>

                <Text
                    numberOfLines={2}
                    className="text-story-ink dark:text-white font-bold text-center mt-2 text-sm leading-5"
                >
                    {book.title}
                </Text>

                <View className="flex-row justify-center gap-1 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <View
                            key={i}
                            className={
                                i < filledDots
                                    ? "w-1.5 h-1.5 rounded-full bg-story-leaf"
                                    : "w-1.5 h-1.5 rounded-full bg-story-ink/15"
                            }
                        />
                    ))}
                </View>
            </AnimatedPressable>
        </Animated.View>
    );
}