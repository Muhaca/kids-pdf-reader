import * as Speech from 'expo-speech';

export const speakText = (text: string) => {
    // Hentikan suara sebelumnya jika masih berjalan
    Speech.stop();

    Speech.speak(text, {
        language: 'id-ID', // Bahasa Indonesia
        pitch: 1.1,        // Suara sedikit lebih ceria untuk anak
        rate: 0.9,         // Kecepatan sedikit diperlambat agar jelas
    });
};

export const stopSpeech = () => {
    Speech.stop();
};