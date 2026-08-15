import { Book } from "@/src/types/book";
import { Pressable, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    FadeInDown,
} from "react-native-reanimated";

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
                    className="aspect-[4/5] rounded-3xl items-center justify-center shadow-md"
                >
                    <Text style={{ fontSize: 56 }}>{book.emoji}</Text>
                    {book.progress === 1 && (
                        <View className="absolute top-2 right-2 bg-white/90 rounded-full w-7 h-7 items-center justify-center">
                            <Text>⭐</Text>
                        </View>
                    )}
                </View>

                <Text
                    numberOfLines={2}
                    className="text-story-ink font-bold text-center mt-2 text-sm leading-5"
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