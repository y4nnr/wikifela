"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface GeoFelaLocation {
  id: number;
  communeName: string;
  department: string;
  departmentName: string;
  latitude: number;
  longitude: number;
  category: string;
  eventDescription: string | null;
  eventDescriptionGame: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  crime: "#fe0000",
  arrest: "#22c55e",
  trial: "#3b82f6",
};

const CATEGORY_LABELS: Record<string, string> = {
  crime: "Crime",
  arrest: "Arrestation",
  trial: "Procès",
};

function makeIcon(color: string) {
  return new L.DivIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="20" height="30">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="${color === '#fe0000' ? '#0a0a0a' : '#ffffff'}"/>
    </svg>`,
    className: "",
    iconSize: [20, 30],
    iconAnchor: [10, 30],
    popupAnchor: [0, -30],
  });
}

const iconCache = new Map<string, L.DivIcon>();
function getIcon(color: string): L.DivIcon {
  if (!iconCache.has(color)) iconCache.set(color, makeIcon(color));
  return iconCache.get(color)!;
}

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

function TileSwapper({ theme }: { theme: "dark" | "light" }) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) map.removeLayer(layerRef.current);
    const url = theme === "dark" ? DARK_TILES : LIGHT_TILES;
    layerRef.current = L.tileLayer(url, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);
  }, [theme, map]);
  return null;
}

function FitBounds({ locations }: { locations: GeoFelaLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((l) => [l.latitude, l.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [locations, map]);
  return null;
}

interface GeoFelaMapProps {
  locations: GeoFelaLocation[];
  hardMode: boolean;
  theme: "dark" | "light";
  airDate: string | null;
}

export default function GeoFelaMap({ locations, hardMode, theme, airDate }: GeoFelaMapProps) {
  const isDark = theme === "dark";

  const markers = useMemo(
    () =>
      locations.map((loc) => {
        const color = CATEGORY_COLORS[loc.category] || CATEGORY_COLORS.crime;
        return { loc, color };
      }),
    [locations]
  );

  return (
    <>
      <style>{`
        .leaflet-container { background: ${isDark ? '#0a0a0a' : '#f5f5f5'}; }
        .leaflet-control-zoom a { background: ${isDark ? '#1a1a1a' : '#ffffff'} !important; color: ${isDark ? '#e5e5e5' : '#333'} !important; border-color: ${isDark ? '#333' : '#ddd'} !important; }
        .leaflet-popup-content-wrapper { background: ${isDark ? '#1a1a1a' : '#ffffff'}; color: ${isDark ? '#e5e5e5' : '#171717'}; border-radius: 8px; }
        .leaflet-popup-tip { background: ${isDark ? '#1a1a1a' : '#ffffff'}; }
        .leaflet-popup-close-button { color: ${isDark ? '#999' : '#666'} !important; }
      `}</style>
      <MapContainer center={[46.6, 2.5]} zoom={6} className="w-full h-full" zoomControl={true}>
        <TileSwapper theme={theme} />
        <FitBounds locations={locations} />
        {markers.map(({ loc, color }) => {
          const description = loc.eventDescriptionGame ?? loc.eventDescription;
          return (
            <Marker key={loc.id} position={[loc.latitude, loc.longitude]} icon={getIcon(color)}>
              <Popup>
                <div className="min-w-[200px]">
                  <div style={{ fontSize: 11, color: isDark ? '#a1a1a1' : '#666', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{loc.communeName} ({loc.departmentName})</span>
                    <span style={{ fontSize: 9, color, fontWeight: 600, textTransform: 'uppercase' }}>{CATEGORY_LABELS[loc.category] || loc.category}</span>
                  </div>
                  {!hardMode && airDate && (
                    <div style={{ fontSize: 10, color: isDark ? '#6b6b6b' : '#999', marginBottom: 4 }}>
                      {new Date(airDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  )}
                  {!hardMode && description && (
                    <p style={{ fontSize: 11, color: isDark ? '#d4d4d4' : '#444', fontStyle: 'italic', lineHeight: 1.4 }}>
                      {description}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}
