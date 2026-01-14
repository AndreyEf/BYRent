import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Filter, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PropertyWithOwner } from "@shared/schema";

const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

async function geocodeAddress(city: string, street: string, building: string): Promise<[number, number] | null> {
  try {
    const query = `${building}, ${street}, ${city}, Russia`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          "User-Agent": "BYRent Property App",
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export default function MapPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [geocodedProperties, setGeocodedProperties] = useState<Map<string, [number, number]>>(new Map());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]);

  const { data: properties, isLoading: propertiesLoading } = useQuery<PropertyWithOwner[]>({
    queryKey: ["/api/properties/map"],
  });

  const { data: cities } = useQuery<string[]>({
    queryKey: ["/api/properties/cities"],
  });

  useEffect(() => {
    const geocodeProperties = async () => {
      if (!properties || properties.length === 0) return;
      
      setIsGeocoding(true);
      const newGeocodedMap = new Map<string, [number, number]>();
      
      for (const property of properties) {
        if (property.latitude && property.longitude) {
          newGeocodedMap.set(property.id, [property.latitude, property.longitude]);
        } else {
          const coords = await geocodeAddress(property.city, property.street, property.building);
          if (coords) {
            newGeocodedMap.set(property.id, coords);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setGeocodedProperties(newGeocodedMap);
      setIsGeocoding(false);
      
      if (newGeocodedMap.size > 0) {
        const firstCoords = Array.from(newGeocodedMap.values())[0];
        setMapCenter(firstCoords);
      }
    };

    geocodeProperties();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    
    return properties.filter(property => {
      if (selectedCity !== "all" && property.city !== selectedCity) {
        return false;
      }
      
      const price = property.rentPrice || 0;
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }
      
      return true;
    });
  }, [properties, selectedCity, priceRange]);

  const requestRentalMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const res = await apiRequest("POST", "/api/requests", { propertyId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/map"] });
      toast({
        title: "Заявка отправлена",
        description: "Владелец получит уведомление о вашей заявке",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("ru-RU").format(value);
  };

  const maxPrice = useMemo(() => {
    if (!properties || properties.length === 0) return 500000;
    const prices = properties.map(p => p.rentPrice || 0).filter(p => p > 0);
    return prices.length > 0 ? Math.max(...prices) : 500000;
  }, [properties]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex">
        {filtersOpen && (
          <aside className="w-80 border-r bg-card p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Фильтры
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFiltersOpen(false)}
                data-testid="button-close-filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Город</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger data-testid="select-city">
                    <SelectValue placeholder="Все города" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все города</SelectItem>
                    {cities?.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Цена аренды (руб./мес.)</Label>
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={0}
                    max={maxPrice}
                    step={1000}
                    data-testid="slider-price"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatPrice(priceRange[0])} ₽</span>
                  <span>{formatPrice(priceRange[1])} ₽</span>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                Найдено: <span className="font-medium text-foreground">{filteredProperties.length}</span> объектов
              </div>

              {isGeocoding && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Загрузка координат...</span>
                </div>
              )}
            </div>
          </aside>
        )}

        <div className="flex-1 relative">
          {!filtersOpen && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 left-4 z-[1000]"
              onClick={() => setFiltersOpen(true)}
              data-testid="button-open-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
            </Button>
          )}

          {propertiesLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} />
              
              {filteredProperties.map(property => {
                const coords = geocodedProperties.get(property.id);
                if (!coords) return null;
                
                return (
                  <Marker
                    key={property.id}
                    position={coords}
                    icon={defaultIcon}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <h3 className="font-semibold mb-1" data-testid={`popup-address-${property.id}`}>
                          {property.fullAddress || `${property.city}, ${property.street}, д. ${property.building}`}
                        </h3>
                        {property.rentPrice && (
                          <p className="text-lg font-bold text-primary mb-2" data-testid={`popup-price-${property.id}`}>
                            {formatPrice(property.rentPrice)} ₽/мес
                          </p>
                        )}
                        {property.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {property.description}
                          </p>
                        )}
                        <div className="text-sm text-muted-foreground mb-2">
                          Владелец: {property.ownerFullName}
                        </div>
                        {user && user.id !== property.ownerId && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => requestRentalMutation.mutate(property.id)}
                            disabled={requestRentalMutation.isPending}
                            data-testid={`button-request-${property.id}`}
                          >
                            {requestRentalMutation.isPending ? "Отправка..." : "Запросить аренду"}
                          </Button>
                        )}
                        {!user && (
                          <p className="text-xs text-muted-foreground">
                            Войдите, чтобы отправить заявку
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </main>
    </div>
  );
}
