import { StyleSheet, Text, View } from "react-native";

const DECORATIONS = [
    { emoji: "⭐", top: "5%", left: "8%", size: 20, rotate: "-15deg" },
    { emoji: "🌈", top: "2%", right: "8%", size: 30, rotate: "8deg" },
    { emoji: "☁️", top: "16%", left: "80%", size: 26, rotate: "0deg" },
    { emoji: "✨", top: "28%", left: "4%", size: 18, rotate: "10deg" },
    { emoji: "🎈", top: "42%", right: "5%", size: 24, rotate: "-8deg" },
    { emoji: "🦋", top: "56%", left: "8%", size: 20, rotate: "12deg" },
    { emoji: "⭐", top: "70%", right: "10%", size: 16, rotate: "20deg" },
    { emoji: "☁️", top: "84%", left: "45%", size: 22, rotate: "0deg" },
    { emoji: "✨", top: "94%", right: "20%", size: 16, rotate: "-10deg" },
];

export function PlayfulBackground() {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {DECORATIONS.map((d, i) => (
                <Text
                    key={i}
                    style={{
                        position: "absolute",
                        top: d.top as any,
                        left: (d as any).left,
                        right: (d as any).right,
                        fontSize: d.size,
                        opacity: 0.16,
                        transform: [{ rotate: d.rotate }],
                    }}
                >
                    {d.emoji}
                </Text>
            ))}
        </View>
    );
}