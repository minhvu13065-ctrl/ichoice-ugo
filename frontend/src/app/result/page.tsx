"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { useTranslations } from "@/lib/i18n";
import { api } from "@/lib/api";

export default function ResultPage() {
  const router = useRouter();
  const { lang, sessionId, result, setResult } = useAppStore();
  const t = useTranslations(lang);
  const [swapping, setSwapping] = useState(false);
  const [swapError, setSwapError] = useState("");

  if (!result) {
    router.replace("/home");
    return null;
  }

  const dishName = lang === "vi" ? result.name_vi : result.name_en;
  const reason = lang === "vi" ? result.reason_vi : result.reason_en;
  const pct = Math.round(result.confidence * 100);

  const handleSwap = async () => {
    setSwapping(true);
    setSwapError("");
    try {
      const next = await api.swap(sessionId, lang);
      setResult(next);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setSwapError(msg.includes("429") ? t("error.swap_limit") : t("error.api_fail"));
    } finally {
      setSwapping(false);
    }
  };

  return (
    <main className="flex flex-col min-h-dvh px-5 py-10 max-w-lg mx-auto gap-6 animate-in">
      <h1 className="text-2xl font-bold text-center">{t("result.title")}</h1>

      {/* Dish card */}
      <div className="card p-6 flex flex-col items-center gap-4">
        {/* Image placeholder */}
        <div
          className="w-full h-52 rounded-2xl flex items-center justify-center text-7xl"
          style={{ background: "var(--bg2)" }}
        >
          🍽️
        </div>

        <h2 className="text-2xl font-black text-center">{dishName}</h2>

        {/* Confidence */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-sm font-medium" style={{ color: "var(--text2)" }}>
            {t("result.confidence")}
          </span>
          <div className="flex-1 h-3 rounded-full" style={{ background: "var(--border)" }}>
            <div
              className="h-3 rounded-full"
              style={{ width: `${pct}%`, background: "var(--accent)" }}
            />
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
            {pct}%
          </span>
        </div>

        {/* Reason */}
        <div className="w-full rounded-xl p-3" style={{ background: "var(--bg2)" }}>
          <span className="text-xs font-semibold" style={{ color: "var(--text2)" }}>
            {t("result.why")}
          </span>
          <p className="mt-1 text-sm font-medium">{reason}</p>
        </div>
      </div>

      {swapError && (
        <p className="text-sm text-center text-red-500">{swapError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          className="btn-primary"
          onClick={() => router.push("/map")}
        >
          {t("result.view_map")}
        </button>

        <button
          className="btn-secondary"
          onClick={handleSwap}
          disabled={swapping}
        >
          {swapping ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : t("result.swap")}
        </button>

        <button
          className="btn-secondary"
          onClick={() => router.push("/review")}
        >
          {t("result.rate")}
        </button>
      </div>

      {/* Back to home */}
      <button
        onClick={() => router.push("/home")}
        className="text-sm text-center mt-2"
        style={{ color: "var(--text2)" }}
      >
        ← Bắt đầu lại
      </button>
    </main>
  );
}
