"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

interface MapLocation {
  communeName: string;
  department: string;
  departmentName: string;
  latitude: number;
  longitude: number;
  eventDescription?: string | null;
  category?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  crime: "#fe0000",
  arrest: "#22c55e",
  trial: "#3b82f6",
};

interface MapEpisode {
  id: number;
  title: string;
  season: number | null;
  episode: number | null;
  airDate: string | null;
  keywords: string[];
  locations: MapLocation[];
}

interface MapViewProps {
  episodes: MapEpisode[];
  colorMap: Map<number, string>;
  theme: "dark" | "light";
}

function makeIcon(color: string) {
  return new L.DivIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="16" height="24">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="${color === '#fe0000' ? '#0a0a0a' : '#ffffff'}"/>
    </svg>`,
    className: "",
    iconSize: [16, 24],
    iconAnchor: [8, 24],
    popupAnchor: [0, -24],
  });
}

const iconCache = new Map<string, L.DivIcon>();
function getIcon(color: string): L.DivIcon {
  if (!iconCache.has(color)) {
    iconCache.set(color, makeIcon(color));
  }
  return iconCache.get(color)!;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

function TileSwapper({ theme }: { theme: "dark" | "light" }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    const url = theme === "dark" ? DARK_TILES : LIGHT_TILES;
    layerRef.current = L.tileLayer(url, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);
  }, [theme, map]);

  return null;
}

export default function MapView({ episodes, colorMap, theme }: MapViewProps) {
  const defaultColor = "#fe0000";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isDark = theme === "dark";

  return (
    <>
      <style>{`
        .leaflet-container { background: ${isDark ? '#0a0a0a' : '#f5f5f5'}; }
        .leaflet-control-zoom a { background: ${isDark ? '#1a1a1a' : '#ffffff'} !important; color: ${isDark ? '#e5e5e5' : '#333'} !important; border-color: ${isDark ? '#333' : '#ddd'} !important; }
        .leaflet-popup-content-wrapper { background: ${isDark ? '#1a1a1a' : '#ffffff'}; color: ${isDark ? '#e5e5e5' : '#171717'}; border-radius: 8px; }
        .leaflet-popup-tip { background: ${isDark ? '#1a1a1a' : '#ffffff'}; }
        .leaflet-popup-close-button { color: ${isDark ? '#999' : '#666'} !important; }
      `}</style>
      <MapContainer
        center={[46.6, 2.5]}
        zoom={isMobile ? 5 : 6}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileSwapper theme={theme} />
        {episodes.flatMap((ep) => {
          const epColor = colorMap.get(ep.id);

          return ep.locations.map((loc, i) => {
            // Use episode color if multi-select, otherwise category color
            const pinColor = epColor ?? CATEGORY_COLORS[loc.category || "crime"] ?? defaultColor;
            const icon = getIcon(pinColor);
            const categoryLabel = loc.category === "arrest" ? "Arrestation" : loc.category === "trial" ? "Tribunal" : "Crime";

            return (
            <Marker
              key={`${ep.id}-${i}`}
              position={[loc.latitude, loc.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div style={{ fontSize: 11, color: isDark ? '#a1a1a1' : '#666', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{loc.communeName} ({loc.departmentName})</span>
                    <span style={{ fontSize: 9, color: pinColor, fontWeight: 600, textTransform: 'uppercase' }}>{categoryLabel}</span>
                  </div>
                  <Link
                    href={`/episode/${ep.id}`}
                    className="font-semibold hover:underline text-sm leading-tight block mb-1"
                    style={{ color: isDark ? '#e5e5e5' : '#171717' }}
                  >
                    {ep.title}
                  </Link>
                  {ep.airDate && (
                    <div style={{ fontSize: 10, color: isDark ? '#6b6b6b' : '#999', marginBottom: 4 }}>
                      {formatDate(ep.airDate)}
                    </div>
                  )}
                  {loc.eventDescription && (
                    <p style={{ fontSize: 11, color: isDark ? '#d4d4d4' : '#444', fontStyle: 'italic', lineHeight: 1.4 }}>
                      {loc.eventDescription}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
            );
          });
        })}
      </MapContainer>
    </>
  );
}
