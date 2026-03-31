"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

import { COLORS } from "@/lib/map-colors";

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

export default function MapView({ episodes, colorMap }: MapViewProps) {
  const defaultColor = "#fe0000";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      <style>{`
        .leaflet-container { background: #0a0a0a; }
        .leaflet-control-zoom a { background: #1a1a1a !important; color: #e5e5e5 !important; border-color: #333 !important; }
        .leaflet-control-zoom a:hover { background: #333 !important; }
        .leaflet-popup-content-wrapper { background: #1a1a1a; color: #e5e5e5; border-radius: 8px; }
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
        {episodes.flatMap((ep) => {
          const color = colorMap.get(ep.id) ?? defaultColor;
          const icon = getIcon(color);

          return ep.locations.map((loc, i) => (
            <Marker
              key={`${ep.id}-${i}`}
              position={[loc.latitude, loc.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="text-xs text-gray-400 mb-1">
                    {loc.communeName} ({loc.departmentName})
                  </div>
                  <Link
                    href={`/episode/${ep.id}`}
                    className="font-semibold hover:underline text-sm leading-tight block mb-1"
                    style={{ color }}
                  >
                    {ep.title}
                  </Link>
                  {ep.airDate && (
                    <div className="text-xs text-gray-400 mb-2">
                      {formatDate(ep.airDate)}
                    </div>
                  )}
                  {loc.eventDescription && (
                    <p className="text-xs text-gray-300 mb-2 leading-relaxed italic">
                      {loc.eventDescription}
                    </p>
                  )}
                  {ep.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ep.keywords.slice(0, 4).map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-300"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ));
        })}
      </MapContainer>
    </>
  );
}

