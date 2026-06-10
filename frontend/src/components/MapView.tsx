"use client";
import { useEffect, useRef } from "react";
import type { Place } from "@/lib/api";

interface Props {
  center: [number, number];
  places: Place[];
  onSelectPlace: (p: Place) => void;
}

export default function MapView({ center, places, onSelectPlace }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Nếu container đã có leaflet map (React Strict Mode gọi 2 lần), xoá trước
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((mapRef.current as any)._leaflet_id) {
      mapInstance.current?.remove();
      mapInstance.current = null;
    }

    if (mapInstance.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current).setView(center, 14);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      L.circleMarker(center, {
        radius: 10,
        fillColor: "#2563eb",
        fillOpacity: 1,
        color: "#fff",
        weight: 3,
      }).addTo(map).bindPopup("Vị trí của bạn");
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when places change
  useEffect(() => {
    if (!mapInstance.current) return;

    import("leaflet").then((L) => {
      // Remove old place markers (class-based)
      mapInstance.current.eachLayer((layer: unknown) => {
        if ((layer as { options?: { className?: string } }).options?.className === "place-marker") {
          mapInstance.current.removeLayer(layer);
        }
      });

      places.forEach((place) => {
        const icon = L.divIcon({
          className: "place-marker",
          html: `<div style="background:#2563eb;color:#fff;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${place.name}</div>`,
          iconAnchor: [0, 0],
        });
        L.marker([place.lat, place.lng], { icon })
          .addTo(mapInstance.current)
          .on("click", () => onSelectPlace(place));
      });
    });
  }, [places, onSelectPlace]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 300 }} />
    </>
  );
}
