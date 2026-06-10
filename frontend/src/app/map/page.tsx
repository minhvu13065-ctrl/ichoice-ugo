"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { useTranslations } from "@/lib/i18n";
import { api, Place } from "@/lib/api";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// Fallback: trung tâm Hà Nội (thay vì HCM — dễ test hơn nếu user ở miền Bắc)
const DEFAULT_CENTER: [number, number] = [21.0278, 105.8342];

export default function MapPage() {
  const router = useRouter();
  const { lang, result } = useAppStore();
  const t = useTranslations(lang);

  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locState, setLocState] = useState<"asking" | "ok" | "denied" | "error">("asking");
  const [loading, setLoading] = useState(false);

  const fetchPlaces = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await api.nearby(lat, lng, 3, result?.dish_id);
      setPlaces(res.places);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [result?.dish_id]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocState("error");
      fetchPlaces(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCoords(c);
        setLocState("ok");
        fetchPlaces(c[0], c[1]);
      },
      () => {
        setLocState("denied");
        // Vẫn load quán với vị trí mặc định
        fetchPlaces(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [fetchPlaces]);

  const center = coords ?? DEFAULT_CENTER;
  const dishName = result ? (lang === "vi" ? result.name_vi : result.name_en) : null;

  return (
    <main className="flex flex-col" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => router.back()} style={{ color: "var(--text2)" }}>←</button>
        <h1 className="text-lg font-bold flex-1">{t("map.title")}</h1>
        {dishName && (
          <span className="text-xs px-3 py-1 rounded-full font-semibold truncate max-w-[120px]"
            style={{ background: "var(--accent)", color: "#fff" }}>
            🍽️ {dishName}
          </span>
        )}
        <button
          onClick={() => router.push("/result")}
          className="text-xs px-3 py-1.5 rounded-full font-semibold shrink-0"
          style={{ background: "var(--bg2)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          ✏️ Sửa
        </button>
      </div>

      {/* Location status bar */}
      {locState === "denied" && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shrink-0"
          style={{ background: "#fff3cd", color: "#856404" }}>
          <span>📍</span>
          <span>Không lấy được vị trí — đang hiển thị quán gần khu vực mặc định.</span>
        </div>
      )}
      {locState === "ok" && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shrink-0"
          style={{ background: "#d1fae5", color: "#065f46" }}>
          <span>✅</span>
          <span>Đã định vị thành công — hiển thị {places.length} quán gần bạn.</span>
        </div>
      )}

      {/* Map — chiếm phần lớn màn hình */}
      <div className="flex-1 relative">
        <MapView
          center={center}
          places={places}
          onSelectPlace={setSelected}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.6)", zIndex: 999 }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Place list dạng horizontal scroll */}
      {places.length > 0 && !selected && (
        <div className="shrink-0 py-3 px-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text2)" }}>
            {places.length} quán gần bạn
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {places.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)}
                className="card shrink-0 p-3 text-left"
                style={{ minWidth: 160 }}>
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>
                  ⭐ {p.rating} · {p.distance_km} km
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected place detail */}
      {selected && (
        <div className="card mx-4 my-3 p-4 animate-in shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-base">{selected.name}</h3>
              <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
                ⭐ {selected.rating} · {selected.distance_km} km
              </p>
              {selected.open && (
                <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>
                  🕐 {selected.open}
                </p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button className="btn-primary py-2 px-4 text-sm"
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`;
                    window.open(url, "_blank");
                  }}>
                  🗺️ Chỉ đường
                </button>
                <button onClick={() => router.push("/review")}
                  className="btn-secondary py-2 px-4 text-sm">
                  ⭐ Đánh giá
                </button>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="ml-2 text-xl shrink-0" style={{ color: "var(--text2)" }}>✕</button>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="shrink-0 px-4 pb-4 pt-2 flex gap-2" style={{ borderTop: selected ? "none" : "1px solid var(--border)" }}>
        <button
          onClick={() => router.push("/result")}
          className="btn-secondary flex-1 py-3 text-sm"
        >
          ← Xem lại kết quả
        </button>
        <button
          onClick={() => router.push("/quiz")}
          className="btn-secondary flex-1 py-3 text-sm"
        >
          🔄 Chọn lại món
        </button>
      </div>
    </main>
  );
}
