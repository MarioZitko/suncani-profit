import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { cities } from "../data/cities";
import { City } from "../types";

const LIGHT_TILE = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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

interface MapProps {
  selectedCity: City;
  onCitySelect: (city: City) => void;
  dark: boolean;
}

export default function Map({ selectedCity, onCitySelect, dark }: MapProps) {
  return (
    <MapContainer
      center={[selectedCity.lat, selectedCity.lng]}
      zoom={7}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        key={dark ? "dark" : "light"}
        url={dark ? DARK_TILE : LIGHT_TILE}
        attribution={ATTRIBUTION}
      />
      <MapController selectedCity={selectedCity} />
      {cities.map((city) => {
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
    </MapContainer>
  );
}
