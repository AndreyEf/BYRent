import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { PropertyCard } from "@/components/property-card";
import { EmptyState } from "@/components/empty-state";
import { PropertyCardSkeleton } from "@/components/loading-skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import type { PropertyWithOwner, RentalRequest } from "@shared/schema";

export default function Browse() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [requestingPropertyId, setRequestingPropertyId] = useState<string | null>(null);

  // Fetch all properties (excluding user's own)
  const { data: properties, isLoading } = useQuery<PropertyWithOwner[]>({
    queryKey: ["/api/properties"],
  });

  // Fetch user's rental requests to check status
  const { data: myRequests } = useQuery<RentalRequest[]>({
    queryKey: ["/api/requests/my"],
  });

  // Create rental request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      setRequestingPropertyId(propertyId);
      const res = await apiRequest("POST", "/api/requests", { propertyId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals/my"] });
      toast({
        title: "Запрос отправлен",
        description: "Владелец недвижимости получит ваш запрос на аренду",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setRequestingPropertyId(null);
    },
  });

  // Filter properties by search query
  const filteredProperties = properties?.filter((property) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      property.address.toLowerCase().includes(query) ||
      property.ownerFullName.toLowerCase().includes(query) ||
      property.cadastralNumber.toLowerCase().includes(query) ||
      property.owner?.visibleId?.toLowerCase().includes(query)
    );
  });

  // Get request for a property
  const getRequestForProperty = (propertyId: string) => {
    return myRequests?.find((r) => r.propertyId === propertyId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-browse-title">
            Поиск недвижимости
          </h1>
          <p className="text-muted-foreground">
            Найдите подходящую недвижимость и отправьте запрос на аренду
          </p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск по адресу, ФИО или ID владельца..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProperties && filteredProperties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => {
              const request = getRequestForProperty(property.id);
              return (
                <PropertyCard
                  key={property.id}
                  property={property}
                  variant="browse"
                  rentalRequest={request}
                  onRequestRental={() => createRequestMutation.mutate(property.id)}
                  isRequesting={requestingPropertyId === property.id}
                />
              );
            })}
          </div>
        ) : searchQuery ? (
          <EmptyState
            icon="search"
            title="Ничего не найдено"
            description="Попробуйте изменить параметры поиска"
          />
        ) : (
          <EmptyState
            icon="property"
            title="Нет доступной недвижимости"
            description="Пока нет объектов для аренды. Загляните позже!"
          />
        )}
      </main>
    </div>
  );
}
