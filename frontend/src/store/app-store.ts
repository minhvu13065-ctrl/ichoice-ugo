import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GroupMode = "solo" | "couple" | "friends" | "family";
export type Lang = "vi" | "en";
export type Theme = "light" | "dark" | "sunset" | "ocean";

export interface QuizAnswers {
  hunger_level: "light" | "medium" | "full";
  flavor: string[];
  temperature: "hot" | "cold" | "any";
  cuisine: string[];
  price_range: "cheap" | "medium" | "expensive" | "any";
  time_available: "quick" | "normal";
  mood: string;
  restrictions: string[];
}

export interface DishResult {
  dish_id: string;
  name_vi: string;
  name_en: string;
  image_url: string;
  confidence: number;
  reason_vi: string;
  reason_en: string;
  session_id: string;
}

interface AppState {
  lang: Lang;
  theme: Theme;
  mode: GroupMode;
  sessionId: string;
  quizAnswers: Partial<QuizAnswers>;
  result: DishResult | null;

  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setMode: (mode: GroupMode) => void;
  setQuizAnswers: (answers: Partial<QuizAnswers>) => void;
  setResult: (result: DishResult | null) => void;
  resetQuiz: () => void;
}

function generateSessionId(): string {
  return `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export const useAppStore = create<AppState>()(
  persist<AppState>(
    (set) => ({
      lang: "vi",
      theme: "light",
      mode: "solo",
      sessionId: generateSessionId(),
      quizAnswers: {},
      result: null,

      setLang: (lang: Lang) => set({ lang }),
      setTheme: (theme: Theme) => set({ theme }),
      setMode: (mode: GroupMode) => set({ mode }),
      setQuizAnswers: (answers: Partial<QuizAnswers>) =>
        set((s: AppState) => ({ quizAnswers: { ...s.quizAnswers, ...answers } })),
      setResult: (result: DishResult | null) => set({ result }),
      resetQuiz: () =>
        set({ quizAnswers: {}, result: null, sessionId: generateSessionId() }),
    }),
    {
      name: "ichoice-storage",
      partialize: (state: AppState) => ({ lang: state.lang, theme: state.theme }) as AppState,
    }
  )
);
