"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { useTranslations } from "@/lib/i18n";
import { api } from "@/lib/api";

const REVIEW_TAGS = ["delicious", "right_taste", "too_salty", "too_spicy", "portion_small", "good_price"] as const;

export default function ReviewPage() {
  const router = useRouter();
  const { lang, sessionId, result } = useAppStore();
  const t = useTranslations(lang);

  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!result) {
    router.replace("/home");
    return null;
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!stars) return;
    setLoading(true);
    try {
      await api.submitReview({
        session_id: sessionId,
        dish_id: result.dish_id,
        stars,
        tags: selectedTags,
        comment,
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex flex-col items-center justify-center min-h-dvh gap-6 animate-in">
        <div className="text-7xl">🙌</div>
        <h2 className="text-2xl font-bold">{t("review.thanks")}</h2>
        <button onClick={() => router.push("/home")} className="btn-primary">
          ← Chọn món khác
        </button>
      </main>
    );
  }

  const dishName = lang === "vi" ? result.name_vi : result.name_en;

  return (
    <main className="flex flex-col min-h-dvh px-5 py-10 max-w-lg mx-auto gap-6 animate-in">
      <h1 className="text-2xl font-bold">{t("review.title")}</h1>
      <p className="font-semibold" style={{ color: "var(--accent)" }}>{dishName}</p>

      {/* Stars */}
      <div>
        <p className="text-sm mb-3 font-medium" style={{ color: "var(--text2)" }}>{t("review.stars")}</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setStars(s)}
              className="text-4xl transition-transform hover:scale-110"
            >
              {s <= (hoveredStar || stars) ? "⭐" : "☆"}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-sm mb-3 font-medium" style={{ color: "var(--text2)" }}>{t("review.tags_label")}</p>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="chip"
              style={
                selectedTags.includes(tag)
                  ? { borderColor: "var(--accent)", background: "var(--accent)", color: "#fff" }
                  : {}
              }
            >
              {t(`review.tags.${tag}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <p className="text-sm mb-2 font-medium" style={{ color: "var(--text2)" }}>{t("review.comment")}</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-2xl text-sm resize-none"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          placeholder="Ví dụ: Nước dùng ngon, nhưng hơi ít thịt..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!stars || loading}
        className="btn-primary"
        style={{ opacity: !stars ? 0.5 : 1 }}
      >
        {loading ? "..." : t("review.submit")}
      </button>
    </main>
  );
}
