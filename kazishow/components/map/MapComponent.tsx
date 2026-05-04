"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_CONFIG } from "./categoryConfig";

export interface MapProvider {
  id: string;
  businessName: string;
  category: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
  profileImage?: string;
  distance?: number;
  description?: string;
  isVerified?: boolean;
  minJobValue?: number;
  servicesCount?: number;
}

interface MapComponentProps {
  providers: MapProvider[];
  userLocation: [number, number] | null;
  selectedId: string | null;
  flyTarget: { coords: [number, number]; zoom?: number; ts: number } | null;
  onSelectProvider: (id: string) => void;
  showRadiusCircle: boolean;
  darkMode?: boolean;
}

// ─── Category config ──────────────────────────────────────────────────────────

export { CATEGORY_CONFIG } from "./categoryConfig";

// ─── SVG pin marker ───────────────────────────────────────────────────────────

function makePinIcon(category: string, selected: boolean, minJobValue?: number) {
  const cfg = CATEGORY_CONFIG[category] ?? { color: "#6B7280", emoji: "📍", label: "" };
  const color = cfg.color;
  const size = selected ? 56 : 46;
  const pinH = size * 1.3;
  const glow = selected ? `filter:drop-shadow(0 0 8px ${color}99);` : "";
  const scale = selected ? "transform:scale(1.15);transform-origin:bottom center;" : "";
  const label = minJobValue ? `KSh ${minJobValue >= 1000 ? (minJobValue / 1000).toFixed(0) + "k" : minJobValue}` : "";

  const html = `
    <div style="position:relative;width:${size}px;height:${pinH + (label ? 18 : 0)}px;display:flex;flex-direction:column;align-items:center;${scale}${glow}transition:all 0.2s ease;">
      ${label ? `<div style="background:white;color:${color};font-size:9px;font-weight:800;padding:1px 5px;border-radius:20px;border:1.5px solid ${color};margin-bottom:2px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.12);">${label}</div>` : ""}
      <svg width="${size}" height="${pinH}" viewBox="0 0 56 73" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="28" cy="69" rx="8" ry="3" fill="rgba(0,0,0,0.12)"/>
        <path d="M28 2C15.3 2 5 12.3 5 25C5 42 28 68 28 68C28 68 51 42 51 25C51 12.3 40.7 2 28 2Z"
          fill="${color}" stroke="white" stroke-width="2.5"/>
        <circle cx="28" cy="25" r="14" fill="white" fill-opacity="0.92"/>
        <text x="28" y="30" text-anchor="middle" font-size="15" font-family="system-ui">${cfg.emoji}</text>
      </svg>
    </div>`;

  return L.divIcon({
    className: "",
    html,
    iconSize: [size, pinH + (label ? 18 : 0)],
    iconAnchor: [size / 2, pinH + (label ? 18 : 0)],
    popupAnchor: [0, -(pinH + (label ? 18 : 0))],
  });
}

// ─── Cluster marker ───────────────────────────────────────────────────────────

function makeClusterIcon(count: number) {
  const size = count > 99 ? 52 : count > 9 ? 46 : 40;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:#FF6B2B;color:white;font-size:13px;font-weight:900;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(255,107,43,0.4);">${count > 99 ? "99+" : count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─── User location marker (pulsing) ───────────────────────────────────────────

function makeUserIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:40px;height:40px;background:rgba(59,130,246,0.15);border-radius:50%;animation:pulse 2s ease-out infinite;"></div>
        <div style="position:absolute;width:28px;height:28px;background:rgba(59,130,246,0.1);border-radius:50%;animation:pulse 2s ease-out infinite 0.4s;"></div>
        <div style="width:16px;height:16px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);position:relative;z-index:1;"></div>
      </div>
      <style>@keyframes pulse{0%{transform:scale(0.5);opacity:0.8}100%{transform:scale(1.8);opacity:0}}</style>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// ─── Simple clustering: group by ~300m grid cells ─────────────────────────────

function clusterProviders(providers: MapProvider[], zoom: number): {
  singles: MapProvider[];
  clusters: { lat: number; lng: number; count: number; ids: string[] }[];
} {
  if (zoom >= 14) return { singles: providers, clusters: [] };

  const precision = zoom >= 12 ? 2 : zoom >= 10 ? 1 : 0;
  const factor = Math.pow(10, precision);
  const cells: Record<string, MapProvider[]> = {};

  for (const p of providers) {
    const key = `${Math.round(p.lat * factor)}_${Math.round(p.lng * factor)}`;
    (cells[key] ??= []).push(p);
  }

  const singles: MapProvider[] = [];
  const clusters: { lat: number; lng: number; count: number; ids: string[] }[] = [];

  for (const group of Object.values(cells)) {
    if (group.length === 1) {
      singles.push(group[0]);
    } else {
      const lat = group.reduce((s, p) => s + p.lat, 0) / group.length;
      const lng = group.reduce((s, p) => s + p.lng, 0) / group.length;
      clusters.push({ lat, lng, count: group.length, ids: group.map((p) => p.id) });
    }
  }
  return { singles, clusters };
}

// ─── Map controller ───────────────────────────────────────────────────────────

function MapController({
  providers, userLocation, selectedId, flyTarget,
  onSelectProvider, showRadiusCircle, darkMode,
}: Omit<MapComponentProps, "flyTarget"> & { flyTarget: MapComponentProps["flyTarget"] }) {
  const map = useMap();
  const markersRef = useRef<Record<string, L.Marker>>({});
  const clusterMarkersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const prevFlyTs = useRef(0);
  const zoomRef = useRef(map.getZoom());

  // Fly to target
  useEffect(() => {
    if (!flyTarget || flyTarget.ts === prevFlyTs.current) return;
    prevFlyTs.current = flyTarget.ts;
    map.flyTo(flyTarget.coords, flyTarget.zoom ?? 14, { duration: 1.2, easeLinearity: 0.5 });
  }, [flyTarget, map]);

  // Manage markers + clustering
  useEffect(() => {
    const zoom = map.getZoom();
    zoomRef.current = zoom;
    const { singles, clusters } = clusterProviders(providers, zoom);

    // Remove stale cluster markers
    clusterMarkersRef.current.forEach((m) => m.remove());
    clusterMarkersRef.current = [];

    // Add cluster markers
    clusters.forEach(({ lat, lng, count, ids }) => {
      const m = L.marker([lat, lng], { icon: makeClusterIcon(count) });
      m.on("click", () => {
        map.flyTo([lat, lng], Math.min(zoom + 2, 15), { duration: 0.8 });
      });
      m.addTo(map);
      clusterMarkersRef.current.push(m);
    });

    // Add / update single markers
    const existing = new Set(Object.keys(markersRef.current));
    const singleIds = new Set(singles.map((p) => p.id));

    // Remove markers not in singles anymore
    existing.forEach((id) => {
      if (!singleIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    singles.forEach((p) => {
      if (!p.lat || !p.lng) return;
      const isSelected = p.id === selectedId;

      if (markersRef.current[p.id]) {
        markersRef.current[p.id].setIcon(makePinIcon(p.category, isSelected, p.minJobValue));
        if (isSelected) markersRef.current[p.id].setZIndexOffset(1000);
        else markersRef.current[p.id].setZIndexOffset(0);
      } else {
        const marker = L.marker([p.lat, p.lng], {
          icon: makePinIcon(p.category, isSelected, p.minJobValue),
          zIndexOffset: isSelected ? 1000 : 0,
        });
        marker.on("click", () => onSelectProvider(p.id));
        marker.addTo(map);
        markersRef.current[p.id] = marker;
      }
    });

    // Re-render on zoom change
    const onZoom = () => {
      const newZoom = map.getZoom();
      if (Math.abs(newZoom - zoomRef.current) >= 1) {
        zoomRef.current = newZoom;
        // Trigger re-render by clearing and redrawing
        Object.values(markersRef.current).forEach((m) => m.remove());
        markersRef.current = {};
      }
    };
    map.on("zoomend", onZoom);
    return () => { map.off("zoomend", onZoom); };
  }, [providers, selectedId, map, onSelectProvider]);

  // Pan to selected
  useEffect(() => {
    if (!selectedId || !markersRef.current[selectedId]) return;
    const marker = markersRef.current[selectedId];
    marker.setIcon(makePinIcon(
      providers.find((p) => p.id === selectedId)?.category ?? "",
      true,
      providers.find((p) => p.id === selectedId)?.minJobValue
    ));
    map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
  }, [selectedId, map, providers]);

  // User location
  useEffect(() => {
    if (!userLocation) return;
    userMarkerRef.current?.remove();
    const m = L.marker(userLocation, { icon: makeUserIcon(), zIndexOffset: 2000 });
    m.addTo(map);
    userMarkerRef.current = m;
    return () => { m.remove(); };
  }, [userLocation, map]);

  // Accuracy radius circle
  useEffect(() => {
    radiusCircleRef.current?.remove();
    if (!showRadiusCircle || !userLocation) return;
    const c = L.circle(userLocation, {
      radius: 5000,
      color: "#3B82F6",
      fillColor: "#3B82F6",
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: "6 4",
    }).addTo(map);
    radiusCircleRef.current = c;
    return () => { c.remove(); };
  }, [showRadiusCircle, userLocation, map]);

  return null;
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function MapComponent(props: MapComponentProps) {
  const center: [number, number] = props.userLocation ?? [-1.2921, 36.8219];

  const lightTile = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const darkTile  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const tileUrl   = props.darkMode ? darkTile : lightTile;
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={tileUrl} attribution={attribution} />
      <MapController {...props} />
    </MapContainer>
  );
}
