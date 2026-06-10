"use client";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { useTranslations } from "@/lib/i18n";
import Logo from "@/components/Logo";

export default function SplashPage() {
  const router = useRouter();
  const { lang, setLang } = useAppStore();
  const t = useTranslations(lang);

  return (
    <main
      className="flex flex-col items-center justify-center min-h-dvh px-6 gap-10 text-center animate-in"
      style={{ background: "linear-gradient(160deg, var(--accent2), var(--accent))" }}
    >
      <Logo size={140} variant="light" />

      <p className="text-base max-w-xs" style={{ color: "rgba(255,255,255,0.9)" }}>
        {t("home.tagline")}
      </p>

      <button
        onClick={() => router.push("/home")}
        className="btn-primary text-lg px-12 py-4"
        style={{ background: "#fff", color: "var(--accent)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
      >
        {t("splash.start")}
      </button>

      <div className="flex gap-2">
        {(["vi", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="px-3 py-1 rounded-full text-sm font-semibold border transition-all"
            style={{
              borderColor: "rgba(255,255,255,0.6)",
              background: lang === l ? "rgba(255,255,255,0.25)" : "transparent",
              color: "#fff",
            }}
          >
            {l === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}
          </button>
        ))}
      </div>
    </main>
  );
}
