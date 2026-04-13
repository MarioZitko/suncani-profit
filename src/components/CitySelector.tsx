import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cities } from "../data/cities";
import { City } from "../types";

interface CitySelectorProps {
  selectedCity: City;
  onChange: (city: City) => void;
}

export default function CitySelector({ selectedCity, onChange }: CitySelectorProps) {
  const handleValueChange = (id: string) => {
    const city = cities.find((c) => c.id === id);
    if (city) onChange(city);
  };

  return (
    <Select value={selectedCity.id} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem key={city.id} value={city.id}>
            {city.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
