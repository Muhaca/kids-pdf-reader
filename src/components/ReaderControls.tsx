import { Pressable, Text, View } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
    page: number;
    numPages: number;
    onClose: () => void;
};

export function ReaderControls({ page, numPages, onClose }: Props) {
    return (
        <>
            <Pressable
                onPress={onClose}
                className="absolute top-4 left-4 bg-black/40 rounded-full w-11 h-11 items-center justify-center"
            >
                <Ionicons name="arrow-back-circle" size={40} color="white" />
            </Pressable>

            <View className="absolute top-4 self-center bg-black/40 rounded-full px-4 py-1.5">
                <Text className="text-white text-xs font-semibold">
                    {page} / {numPages || "-"}
                </Text>
            </View>
        </>
    );
}