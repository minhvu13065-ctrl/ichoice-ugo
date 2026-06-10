"use client";
import { useRouter } from "next/navigation";
import { useAppStore, Theme, Lang } from "@/store/app-store";
import { useTranslations } from "@/lib/i18n";

const THEMES: { key: Theme; emoji: string }[] = [
  { key: "light", emoji: "☀️" },
  { key: "dark", emoji: "🌙" },
  { key: "sunset", emoji: "🌅" },
  { key: "ocean", emoji: "🌊" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { lang, theme, setLang, setTheme } = useAppStore();
  const t = useTranslations(lang);

  return (
    <main className="flex flex-col min-h-dvh px-5 py-10 max-w-lg mx-auto gap-8 animate-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} style={{ color: "var(--text2)" }}>←</button>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
      </div>

      {/* Language */}
      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--text2)" }}>
          {t("settings.language")}
        </p>
        <div className="flex gap-3">
          {(["vi", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="chip"
              style={
                lang === l
                  ? { borderColor: "var(--accent)", background: "var(--accent)", color: "#fff" }
                  : {}
              }
            >
              {l === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section>
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--text2)" }}>
          {t("settings.theme")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(({ key, emoji }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className="card p-4 flex items-center gap-3 cursor-pointer transition-all"
              style={{
                borderWidth: 2,
                borderColor: theme === key ? "var(--accent)" : "var(--border)",
                background: theme === key ? "var(--accent)" : "var(--card)",
                color: theme === key ? "#fff" : "var(--text)",
              }}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="font-semibold">{t(`settings.theme_${key}`)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom nav */}
      <div className="mt-auto pt-8 flex justify-around border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => router.push("/home")} className="flex flex-col items-center gap-1 text-xs" style={{ color: "var(--text2)" }}>
          <span className="text-xl">🏠</span>{t("nav.home")}
        </button>
        <button onClick={() => router.push("/map")} className="flex flex-col items-center gap-1 text-xs" style={{ color: "var(--text2)" }}>
          <span className="text-xl">🗺️</span>{t("nav.map")}
        </button>
        <button className="flex flex-col items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
          <span className="text-xl">⚙️</span>{t("nav.settings")}
        </button>
      </div>
    </main>
  );
}
