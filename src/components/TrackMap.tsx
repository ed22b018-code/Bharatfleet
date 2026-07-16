"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import "leaflet/dist/leaflet.css";

type Pt = { lat: number; lng: number };

// Live tracking map using raw Leaflet + OpenStreetMap tiles (no API key).
// Custom div icons avoid Leaflet's default marker image path issues in bundlers.
export default function TrackMap({
  pickup,
  drop,
  truck,
  pickupLabel,
  dropLabel,
}: {
  pickup: Pt;
  drop: Pt;
  truck: Pt;
  pickupLabel: string;
  dropLabel: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const truckRef = useRef<Marker | null>(null);
  const lineRef = useRef<Polyline | null>(null);

  // Init once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;

      const map = L.map(elRef.current, { zoomControl: true, attributionControl: true });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const pin = (emoji: string, color: string) =>
        L.divIcon({
          className: "",
          html: `<div style="font-size:22px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))">${emoji}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 22],
        });

      L.marker([pickup.lat, pickup.lng], { icon: pin("📍", "green") })
        .addTo(map)
        .bindTooltip(`Pickup · ${pickupLabel}`, { direction: "top" });
      L.marker([drop.lat, drop.lng], { icon: pin("🏁", "red") })
        .addTo(map)
        .bindTooltip(`Drop · ${dropLabel}`, { direction: "top" });

      lineRef.current = L.polyline(
        [
          [pickup.lat, pickup.lng],
          [drop.lat, drop.lng],
        ],
        { color: "#1a57e0", weight: 4, opacity: 0.7, dashArray: "8 8" }
      ).addTo(map);

      truckRef.current = L.marker([truck.lat, truck.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="font-size:26px">🚚</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        zIndexOffset: 1000,
      }).addTo(map);

      map.fitBounds(
        [
          [pickup.lat, pickup.lng],
          [drop.lat, drop.lng],
        ],
        { padding: [40, 40] }
      );
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the truck when position updates.
  useEffect(() => {
    truckRef.current?.setLatLng([truck.lat, truck.lng]);
  }, [truck.lat, truck.lng]);

  return <div ref={elRef} className="h-72 w-full sm:h-96" />;
}
