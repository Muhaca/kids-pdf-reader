import "./global.css";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFonts, Baloo2_700Bold, Baloo2_600SemiBold, Baloo2_500Medium } from "@expo-google-fonts/baloo-2";
import { Book } from "./src/types/book";
import { ReaderScreen } from "./src/screens/ReaderScreen";
import { LibraryScreen } from "./src/screens/LibraryScreen";

export default function App() {
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  // Muat font latar belakang tanpa menahan frame pertama (lazy start).
  useFonts({ Baloo2_700Bold, Baloo2_600SemiBold, Baloo2_500Medium });

  useEffect(() => {
    if (!activeBook) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [activeBook]);

  return (
    <SafeAreaProvider>
      {activeBook ? (
        <ReaderScreen
          book={activeBook}
          onClose={() => setActiveBook(null)}
          onOpenSettings={() => Alert.alert("Area Orang Tua", "Settings belum dibangun")}
        />
      ) : (
        <LibraryScreen onOpenBook={setActiveBook} />
      )}
    </SafeAreaProvider>
  );
}