import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence,
    FadeInDown,
} from "react-native-reanimated";
import { Book } from "../types/book";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
    book: Book;
    index: number;
    onPress: (book: Book) => void;
    compact?: boolean;
};

export function BookCard({ book, index, onPress, compact = false }: Props) {
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.94);
        rotate.value = withSequence(
            withSpring(-2, { duration: 100 }),
            withSpring(2, { duration: 100 }),
            withSpring(0, { duration: 100 })
        );
    };

    const filledStars = Math.round(book.progress * 5);
    const isFinished = book.progress >= 1;
    const rotateDeg = index % 2 === 0 ? "-1.5deg" : "1.5deg";

    return (
        <Animated.View
            entering={FadeInDown.delay((compact ? index * 40 : index * 70)).springify()}
            className={compact ? "w-32" : "w-1/2 p-2"}
        >
            <AnimatedPressable
                style={animatedStyle}
                onPressIn={handlePressIn}
                onPressOut={() => (scale.value = withSpring(1))}
                onPress={() => onPress(book)}
            >
                <View
                    style={{ backgroundColor: book.accent, transform: [{ rotate: rotateDeg }] }}
                    className={
                        compact
                            ? "aspect-4/5 rounded-2xl overflow-hidden items-center justify-center border-2 border-story-cream shadow-sm"
                            : "aspect-4/5 rounded-[32px] overflow-hidden items-center justify-center border-4 border-story-cream shadow-md"
                    }
                >
                    {book.coverUrl ? (
                        <Image
                            source={{ uri: book.coverUrl }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            transition={300}
                        />
                    ) : (
                        <Text style={{ fontSize: 56 }}>{book.emoji ?? "📖"}</Text>
                    )}

                    {isFinished && (
                        <View className="absolute top-2 right-2 rounded-full w-9 h-9 items-center justify-center border-2 border-story-cream-soft bg-story-coral shadow-sm">
                            <Text style={{ fontSize: 16 }}>🏆</Text>
                        </View>
                    )}
                </View>

                <Text
                    numberOfLines={2}
                    className="text-story-ink dark:text-story-ink-dark text-center mt-2 text-sm leading-5"
                    style={{ fontFamily: "Baloo2_700Bold" }}
                >
                    {book.title}
                </Text>

                <View className="flex-row justify-center gap-1 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Text key={i} style={{ fontSize: 12, opacity: i < filledStars ? 1 : 0.2 }}>
                            ⭐
                        </Text>
                    ))}
                </View>
            </AnimatedPressable>
        </Animated.View>
    );
}