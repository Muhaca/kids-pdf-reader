import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";

const VOICE_OPTIONS = {
    language: "id-ID",
    pitch: 1.1,
    rate: 0.9,
};

export function useReadAloud(text: string | null) {
    const [isReading, setIsReading] = useState(false);
    const speakingRef = useRef(false);
    const genRef = useRef(0);

    const stop = useCallback(async () => {
        genRef.current++;
        speakingRef.current = false;
        setIsReading(false);
        await Speech.stop();
    }, []);

    const speak = useCallback(async (value: string) => {
        if (!value) return;
        const gen = ++genRef.current;
        await Speech.stop();

        speakingRef.current = true;
        setIsReading(true);

        Speech.speak(value, {
            ...VOICE_OPTIONS,
            onStart: () => {
                if (genRef.current === gen) setIsReading(true);
            },
            onDone: () => {
                if (genRef.current === gen) {
                    speakingRef.current = false;
                    setIsReading(false);
                }
            },
            onStopped: () => {
                if (genRef.current === gen) {
                    speakingRef.current = false;
                    setIsReading(false);
                }
            },
            onError: () => {
                if (genRef.current === gen) {
                    speakingRef.current = false;
                    setIsReading(false);
                }
            },
        });
    }, []);

    const toggle = useCallback(() => {
        if (speakingRef.current) {
            stop();
        } else {
            speak(text ?? "");
        }
    }, [text, speak, stop]);

    // Pindah halaman saat sedang membaca → bacakan halaman baru.
    useEffect(() => {
        if (speakingRef.current && text) {
            speak(text);
        }
    }, [text, speak]);

    // Halaman tidak punya teks → hentikan pembacaan.
    useEffect(() => {
        if (!text && speakingRef.current) {
            stop();
        }
    }, [text, stop]);

    // Matikan suara saat komponen dibongkar.
    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    return { isReading, toggle };
}