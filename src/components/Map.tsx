import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, FeatureGroup } from "react-leaflet";
import { GeomanControls } from "react-leaflet-geoman-v2";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
import { cities } from "../data/cities";
import { City, MapMode } from "../types";
import "leaflet-geosearch/dist/geosearch.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

const LIGHT_TILE = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const ESRI_TILE = "/api/esri-tiles/{z}/{y}/{x}";
const ESRI_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";

// --- MapController ---

interface MapControllerProps {
  selectedCity: City;
}

function MapController({ selectedCity }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([selectedCity.lat, selectedCity.lng], 10, { duration: 1.2 });
  }, [selectedCity, map]);

  return null;
}

// --- AddressSearch (satellite mode only) ---

function AddressSearch() {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider({ params: { countrycodes: "hr" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchControl = (GeoSearchControl as any)({
      provider,
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: "Traži adresu...",
    });

    map.addControl(searchControl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleResult = (e: any) => {
      const { x, y } = e.location;
      map.flyTo([y, x], 19, { duration: 1.5 });
    };

    map.on("geosearch/showlocation", handleResult);

    return () => {
      map.removeControl(searchControl);
      map.off("geosearch/showlocation", handleResult);
    };
  }, [map]);

  return null;
}

// --- GeomanHandler — listens to pm:create on the map ---

interface GeomanHandlerProps {
  onRoofDrawn?: (latLngs: [number, number][]) => void;
}

function GeomanHandler({ onRoofDrawn }: GeomanHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (!onRoofDrawn) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCreate = (e: any) => {
      // getLatLngs()[0] gives the outer ring of the polygon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lls: [number, number][] = e.layer
        .getLatLngs()[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((ll: any) => [ll.lat, ll.lng] as [number, number]);
      onRoofDrawn(lls);
    };

    map.on("pm:create", handleCreate);
    return () => {
      map.off("pm:create", handleCreate);
    };
  }, [map, onRoofDrawn]);

  return null;
}

// --- Map ---

interface MapProps {
  selectedCity: City;
  onCitySelect: (city: City) => void;
  dark: boolean;
  mode?: MapMode;
  onRoofDrawn?: (latLngs: [number, number][]) => void;
}

export default function Map({
  selectedCity,
  onCitySelect,
  dark,
  mode = "city",
  onRoofDrawn,
}: MapProps) {
  return (
    <MapContainer
      center={[selectedCity.lat, selectedCity.lng]}
      zoom={7}
      maxZoom={20}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      {mode === "satellite" ? (
        <TileLayer url={ESRI_TILE} attribution={ESRI_ATTRIBUTION} maxNativeZoom={19} maxZoom={21} keepBuffer={4} />
      ) : (
        <TileLayer
          key={dark ? "dark" : "light"}
          url={dark ? DARK_TILE : LIGHT_TILE}
          attribution={CARTO_ATTRIBUTION}
        />
      )}

      <MapController selectedCity={selectedCity} />

      {mode === "city" &&
        cities.map((city) => {
          const isSelected = city.id === selectedCity.id;
          return (
            <CircleMarker
              key={city.id}
              center={[city.lat, city.lng]}
              radius={isSelected ? 12 : 8}
              pathOptions={{
                color: isSelected ? "#ffffff" : "#f59e0b",
                weight: isSelected ? 3 : 1,
                fillColor: "#f59e0b",
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => onCitySelect(city) }}
            >
              <Tooltip>{city.name}</Tooltip>
            </CircleMarker>
          );
        })}

      {mode === "satellite" && (
        <>
          <FeatureGroup>
            <GeomanControls
              options={{
                position: "topleft",
                drawPolygon: true,
                drawMarker: false,
                drawCircleMarker: false,
                drawPolyline: false,
                drawRectangle: false,
                drawCircle: false,
                drawText: false,
                editMode: true,
                dragMode: false,
                cutPolygon: false,
                removalMode: true,
              }}
              globalOptions={{
                continueDrawing: false,
                editable: false,
                templineStyle: { color: "#f59e0b" },
                hintlineStyle: { color: "#f59e0b" },
                pathOptions: { color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.2 },
              }}
            />
          </FeatureGroup>
          <GeomanHandler onRoofDrawn={onRoofDrawn} />
          <AddressSearch />
        </>
      )}
    </MapContainer>
  );
}
