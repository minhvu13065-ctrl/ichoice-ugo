"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { useTranslations } from "@/lib/i18n";
import { api, Question } from "@/lib/api";

// Axes đưa vào "answers" (backend QuizAnswers model)
const CORE_AXES = new Set(["hunger_level","flavor","temperature","cuisine","price_range","time_available","mood","restrictions"]);

function isVisible(q: Question, answers: Record<string, string>): boolean {
  const cond = q.condition as Record<string, string> | null;
  if (!cond) return true;
  if (cond.axis && cond.value) return answers[cond.axis] === cond.value;
  return true;
}

export default function QuizPage() {
  const router = useRouter();
  const { lang, mode, sessionId, setQuizAnswers, setResult } = useAppStore();
  const t = useTranslations(lang);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionsError, setQuestionsError] = useState(false);

  useEffect(() => {
    setQuestionsError(false);
    api.getQuestions(mode, lang)
      .then((r) => setAllQuestions(r.questions))
      .catch(() => setQuestionsError(true));
  }, [mode, lang]);

  // Danh sách câu hỏi hiện tại (lọc conditional)
  const visibleQuestions = allQuestions.filter((q) => isVisible(q, answers));
  const totalQ = visibleQuestions.length;
  const q = visibleQuestions[current];

  if (!allQuestions.length || !q) {
    if (questionsError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6 text-center animate-in">
          <p className="font-medium" style={{ color: "var(--text2)" }}>{t("error.api_fail")}</p>
          <button onClick={() => router.push("/home")} className="btn-primary px-8 py-3">
            ← {t("quiz.back")}
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="spinner" />
      </div>
    );
  }

  const handleSelect = (value: string) => {
    const updated = { ...answers, [q.axis]: value };
    setAnswers(updated);

    const nextIdx = current + 1;
    // Tìm câu tiếp theo khả dụng sau khi cập nhật answers
    const nextVisible = allQuestions.filter((aq) => isVisible(aq, updated));
    if (nextIdx < nextVisible.length) {
      setTimeout(() => setCurrent(nextIdx), 260);
    } else {
      submitQuiz(updated);
    }
  };

  const submitQuiz = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    setError("");

    // Tách core answers vs extra fields
    const coreAnswers: Record<string, string> = {};
    const extra: Record<string, string> = {};
    for (const [k, v] of Object.entries(finalAnswers)) {
      if (CORE_AXES.has(k)) coreAnswers[k] = v;
      else extra[k] = v;
    }

    try {
      const result = await api.recommend({
        answers: coreAnswers,
        mode,
        lang,
        session_id: sessionId,
        extra,
      });
      setQuizAnswers(coreAnswers as Parameters<typeof setQuizAnswers>[0]);
      setResult(result);
      router.push("/result");
    } catch {
      setError(t("error.api_fail"));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-6 animate-in">
        <div className="text-6xl animate-bounce">🤔</div>
        <div className="spinner" />
        <p className="font-medium" style={{ color: "var(--text2)" }}>{t("quiz.thinking")}</p>
      </div>
    );
  }

  const progress = ((current + 1) / totalQ) * 100;

  return (
    <main className="flex flex-col min-h-dvh px-5 py-8 max-w-lg mx-auto animate-in">
      {/* Progress bar */}
      <div className="w-full h-2 rounded-full mb-2" style={{ background: "var(--border)" }}>
        <div
          className="h-2 rounded-full transition-all duration-400"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--accent), var(--accent2))" }}
        />
      </div>
      <p className="text-xs mb-8" style={{ color: "var(--text2)" }}>
        {t("quiz.progress").replace("{current}", String(current + 1)).replace("{total}", String(totalQ))}
      </p>

      {/* Question */}
      <h2 className="text-2xl font-bold mb-8 leading-snug">{q.text}</h2>

      {/* Options */}
      <div className="flex flex-wrap gap-3">
        {q.options.map((opt) => {
          const selected = answers[q.axis] === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="chip"
              style={selected ? { borderColor: "var(--accent)", background: "var(--accent)", color: "#fff" } : {}}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}

      {current > 0 && (
        <button
          onClick={() => setCurrent((c) => c - 1)}
          className="mt-auto pt-8 text-sm"
          style={{ color: "var(--text2)" }}
        >
          ← {t("quiz.back")}
        </button>
      )}
    </main>
  );
}
