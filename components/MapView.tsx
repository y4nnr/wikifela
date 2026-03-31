"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { COLORS } from "@/lib/map-colors";

interface MapLocation {
  communeName: string;
  department: string;
  departmentName: string;
  latitude: number;
  longitude: number;
  eventDescription?: string | null;
}

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
}

interface GroupedPin {
  lat: number;
  lng: number;
  communeName: string;
  departmentName: string;
  entries: {
    episode: MapEpisode;
    description: string | null;
    color: string;
  }[];
}

function makeIcon(color: string) {
  return new L.DivIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="16" height="24">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="#0a0a0a"/>
    </svg>`,
    className: "",
    iconSize: [16, 24],
    iconAnchor: [8, 24],
    popupAnchor: [0, -24],
  });
}

function makeBadgeIcon(color: string, count: number) {
  return new L.DivIcon({
    html: `<div style="position:relative">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="16" height="24">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="12" r="5" fill="#0a0a0a"/>
      </svg>
      <span style="position:absolute;top:-6px;right:-8px;background:#fcf84f;color:#0a0a0a;font-size:9px;font-weight:bold;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;">${count}</span>
    </div>`,
    className: "",
    iconSize: [16, 24],
    iconAnchor: [8, 24],
    popupAnchor: [0, -24],
  });
}

const iconCache = new Map<string, L.DivIcon>();
function getIcon(color: string, count: number): L.DivIcon {
  const key = `${color}-${count}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, count > 1 ? makeBadgeIcon(color, count) : makeIcon(color));
  }
  return iconCache.get(key)!;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MapView({ episodes, colorMap }: MapViewProps) {
  const defaultColor = "#fe0000";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Group pins by coordinates (round to ~100m to catch near-duplicates)
  const grouped = useMemo(() => {
    const map = new Map<string, GroupedPin>();

    for (const ep of episodes) {
      const color = colorMap.get(ep.id) ?? defaultColor;
      for (const loc of ep.locations) {
        const key = `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
        if (!map.has(key)) {
          map.set(key, {
            lat: loc.latitude,
            lng: loc.longitude,
            communeName: loc.communeName,
            departmentName: loc.departmentName,
            entries: [],
          });
        }
        map.get(key)!.entries.push({
          episode: ep,
          description: loc.eventDescription ?? null,
          color,
        });
      }
    }

    return [...map.values()];
  }, [episodes, colorMap, defaultColor]);

  return (
    <>
      <style>{`
        .leaflet-container { background: #0a0a0a; }
        .leaflet-control-zoom a { background: #1a1a1a !important; color: #e5e5e5 !important; border-color: #333 !important; }
        .leaflet-control-zoom a:hover { background: #333 !important; }
        .leaflet-popup-content-wrapper { background: #1a1a1a; color: #e5e5e5; border-radius: 8px; max-height: 300px; overflow-y: auto; }
        .leaflet-popup-tip { background: #1a1a1a; }
        .leaflet-popup-close-button { color: #999 !important; }
      `}</style>
      <MapContainer
        center={[46.6, 2.5]}
        zoom={isMobile ? 5 : 6}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?lang=fr"
        />
        {grouped.map((pin) => {
          const mainColor = pin.entries[0].color;
          const icon = getIcon(mainColor, pin.entries.length);

          return (
            <Marker
              key={`${pin.lat}-${pin.lng}`}
              position={[pin.lat, pin.lng]}
              icon={icon}
            >
              <Popup>
                <div className="min-w-[220px] max-w-[280px]">
                  <div className="text-xs text-gray-400 mb-2 font-semibold">
                    {pin.communeName} ({pin.departmentName})
                    {pin.entries.length > 1 && (
                      <span className="text-[#fcf84f] ml-1">
                        — {pin.entries.length} affaires
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {pin.entries.map((entry, i) => (
                      <div key={`${entry.episode.id}-${i}`} className={i > 0 ? "border-t border-gray-700 pt-2" : ""}>
                        <Link
                          href={`/episode/${entry.episode.id}`}
                          className="font-semibold hover:underline text-sm leading-tight block mb-0.5"
                          style={{ color: entry.color }}
                        >
                          {entry.episode.title}
                        </Link>
                        {entry.episode.airDate && (
                          <div className="text-[10px] text-gray-500">
                            {formatDate(entry.episode.airDate)}
                          </div>
                        )}
                        {entry.description && (
                          <p className="text-[11px] text-gray-300 leading-relaxed italic mt-0.5">
                            {entry.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}
