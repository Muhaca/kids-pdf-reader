import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

const module = requireOptionalNativeModule("MacaLockTask") as
    | {
          isLockTaskActive: () => Promise<boolean>;
          startLockTask: () => Promise<void>;
          stopLockTask: () => Promise<void>;
      }
    | null;

export async function isLockTaskActive(): Promise<boolean> {
    if (Platform.OS !== "android" || !module) return false;
    try {
        return Boolean(await module.isLockTaskActive());
    } catch {
        return false;
    }
}

export async function startLockTask(): Promise<void> {
    if (Platform.OS !== "android" || !module) return;
    try {
        await module.startLockTask();
    } catch {
        // abaikan — bisa jadi tidak didukung MIUI tertentu
    }
}

export async function stopLockTask(): Promise<void> {
    if (Platform.OS !== "android" || !module) return;
    try {
        await module.stopLockTask();
    } catch {
        // abaikan
    }
}