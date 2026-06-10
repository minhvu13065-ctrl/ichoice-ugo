"use client";
import { useRouter } from "next/navigation";
import { useAppStore, GroupMode } from "@/store/app-store";
import { useTranslations } from "@/lib/i18n";
import Logo from "@/components/Logo";

const MODES: { key: GroupMode; emoji: string }[] = [
  { key: "solo", emoji: "🧍" },
  { key: "couple", emoji: "💑" },
  { key: "friends", emoji: "👯" },
  { key: "family", emoji: "👨‍👩‍👧‍👦" },
];

export default function HomePage() {
  const router = useRouter();
  const { lang, mode, setMode, resetQuiz } = useAppStore();
  const t = useTranslations(lang);

  const handleStart = () => {
    resetQuiz();
    router.push("/quiz");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh px-5 py-10 gap-8 animate-in">
      <div className="text-center">
        <Logo size={64} />
        <p className="mt-3 text-base" style={{ color: "var(--text2)" }}>
          {t("home.tagline")}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-center font-semibold mb-4" style={{ color: "var(--text2)" }}>
          {t("home.select_mode")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {MODES.map(({ key, emoji }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className="card p-4 flex flex-col items-center gap-2 transition-all cursor-pointer"
              style={{
                borderWidth: 2,
                borderColor: mode === key ? "var(--accent)" : "var(--border)",
                background: mode === key ? "var(--accent)" : "var(--card)",
                color: mode === key ? "#fff" : "var(--text)",
              }}
            >
              <span className="text-3xl">{emoji}</span>
              <span className="font-semibold text-sm">{t(`home.${key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleStart} className="btn-primary text-lg px-10 py-4">
        {t("home.start")}
      </button>

      <div className="flex gap-2">
        {(["vi", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => useAppStore.getState().setLang(l)}
            className="px-3 py-1 rounded-full text-sm font-semibold border transition-all"
            style={{
              borderColor: lang === l ? "var(--accent)" : "var(--border)",
              background: lang === l ? "var(--accent)" : "transparent",
              color: lang === l ? "#fff" : "var(--text)",
            }}
          >
            {l === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
          </button>
        ))}
      </div>
    </main>
  );
}
