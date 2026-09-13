import "./global.css";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFonts, Baloo2_700Bold, Baloo2_600SemiBold, Baloo2_500Medium } from "@expo-google-fonts/baloo-2";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import { Book } from "./src/types/book";
import { ReaderScreen } from "./src/screens/ReaderScreen";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { ParentSettingsModal } from "./src/components/ParentSettingsModal";
import { getItem, setItem } from "./src/services/storage";
import { isLockTaskActive, startLockTask, stopLockTask } from "./src/services/lockTask";

const KID_MODE_KEY = "kidMode";

export default function App() {
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [kidMode, setKidMode] = useState(() => getItem(KID_MODE_KEY) === "1");
  const [lockActive, setLockActive] = useState(false);
  // Muat font latar belakang tanpa menahan frame pertama (lazy start).
  useFonts({ Baloo2_700Bold, Baloo2_600SemiBold, Baloo2_500Medium });

  useEffect(() => {
    if (!activeBook) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
  }, [activeBook]);

  // Mode Anak: kunci aplikasi otomatis saat dibuka (cold start) & pantau status kunci.
  useEffect(() => {
    if (kidMode) {
      startLockTask();
    }
    let cancelled = false;
    const id = setInterval(async () => {
      const active = await isLockTaskActive();
      if (!cancelled) setLockActive(active);
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [kidMode]);

  useEffect(() => {
    if (kidMode) {
      activateKeepAwake().catch(() => {});
      return () => {
        deactivateKeepAwake().catch(() => {});
      };
    }
  }, [kidMode]);

  const handleToggleKidMode = async (next: boolean) => {
    if (next) {
      setKidMode(true);
      setItem(KID_MODE_KEY, "1");
    } else {
      await stopLockTask();
      setKidMode(false);
      setItem(KID_MODE_KEY, "0");
    }
  };

  const handleOpenBook = useCallback((book: Book) => setActiveBook(book), []);
  const handleOpenSettings = useCallback(() => setShowSettings(true), []);

  return (
    <SafeAreaProvider>
      {activeBook ? (
        <ReaderScreen book={activeBook} onClose={() => setActiveBook(null)} />
      ) : (
        <LibraryScreen onOpenBook={handleOpenBook} onOpenSettings={handleOpenSettings} locked={lockActive} />
      )}

      <ParentSettingsModal
        visible={showSettings}
        kidMode={kidMode}
        onToggleKidMode={handleToggleKidMode}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaProvider>
  );
}