const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "API error");
  }
  return res.json();
}

export const api = {
  getQuestions: (mode: string, lang: string) =>
    request<{ questions: Question[] }>(`/api/quiz/questions?mode=${mode}&lang=${lang}`),

  recommend: (body: RecommendBody) =>
    request<DishResult>("/api/recommendation", { method: "POST", body: JSON.stringify(body) }),

  swap: (session_id: string, lang: string) =>
    request<DishResult>("/api/recommendation/another", {
      method: "POST",
      body: JSON.stringify({ session_id, lang }),
    }),

  nearby: (lat: number, lng: number, radius = 3, dish_id?: string) => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
    if (dish_id) params.set("dish_id", dish_id);
    return request<{ places: Place[] }>(`/api/places/nearby?${params}`);
  },

  submitReview: (body: ReviewBody) =>
    request("/api/reviews", { method: "POST", body: JSON.stringify(body) }),
};

export interface Question {
  id: string;
  order: number;
  axis: string;
  text: string;
  options: { value: string; label: string }[];
  condition: null | Record<string, string>;
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

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  dishes: string[];
  distance_km: number;
  open?: string;
}

export interface RecommendBody {
  answers: Record<string, unknown>;
  mode: string;
  lang: string;
  session_id: string;
  lat?: number;
  lng?: number;
  extra?: Record<string, string>;
}

export interface ReviewBody {
  session_id: string;
  dish_id: string;
  stars: number;
  tags: string[];
  comment: string;
}
