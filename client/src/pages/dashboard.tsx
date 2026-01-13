import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { PropertyCard } from "@/components/property-card";
import { PropertyForm } from "@/components/property-form";
import { RentalRequestCard } from "@/components/rental-request-card";
import { TenantManager } from "@/components/tenant-manager";
import { EmptyState } from "@/components/empty-state";
import { PropertyCardSkeleton, RequestCardSkeleton } from "@/components/loading-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Home, Bell } from "lucide-react";
import type { Property, PropertyWithOwner, RentalRequest, InsertProperty, RentalRequestWithDetails } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("rentals");
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [managingTenantProperty, setManagingTenantProperty] = useState<PropertyWithOwner | null>(null);

  // Fetch my properties
  const { data: myProperties, isLoading: propertiesLoading } = useQuery<PropertyWithOwner[]>({
    queryKey: ["/api/properties/my"],
  });

  // Fetch my rentals (properties I'm renting or requested)
  const { data: myRentals, isLoading: rentalsLoading } = useQuery<{ property: PropertyWithOwner; request: RentalRequest }[]>({
    queryKey: ["/api/rentals/my"],
  });

  // Fetch incoming rental requests for my properties
  const { data: incomingRequests, isLoading: requestsLoading } = useQuery<RentalRequestWithDetails[]>({
    queryKey: ["/api/requests/incoming"],
  });

  const pendingRequestsCount = incomingRequests?.filter(r => r.status === "pending").length || 0;

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      const res = await apiRequest("POST", "/api/properties", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/my"] });
      setPropertyFormOpen(false);
      toast({
        title: "Недвижимость добавлена",
        description: "Объект успешно добавлен в ваш список",
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

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertProperty }) => {
      const res = await apiRequest("PATCH", `/api/properties/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/my"] });
      setEditingProperty(null);
      toast({
        title: "Изменения сохранены",
        description: "Данные недвижимости обновлены",
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

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/my"] });
      setDeletingPropertyId(null);
      toast({
        title: "Недвижимость удалена",
        description: "Объект удален из вашего списка",
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

  // Handle rental request (approve/reject)
  const handleRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const res = await apiRequest("PATCH", `/api/requests/${id}`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests/incoming"] });
      toast({
        title: variables.status === "approved" ? "Запрос одобрен" : "Запрос отклонен",
        description: variables.status === "approved" 
          ? "Арендатор получит уведомление об одобрении"
          : "Арендатор получит уведомление об отклонении",
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

  // Cancel rental request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/requests/${id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals/my"] });
      toast({
        title: "Заявка отменена",
        description: "Ваша заявка на аренду была отменена",
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

  const handleCreateProperty = (data: InsertProperty) => {
    createPropertyMutation.mutate(data);
  };

  const handleUpdateProperty = (data: InsertProperty) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">
            Добро пожаловать, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Управляйте своей недвижимостью и арендой
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="rentals" className="flex items-center gap-2" data-testid="tab-rentals">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Моя аренда</span>
              <span className="sm:hidden">Аренда</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2" data-testid="tab-properties">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Моя недвижимость</span>
              <span className="sm:hidden">Недвиж.</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2" data-testid="tab-requests">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Запросы</span>
              {pendingRequestsCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                  {pendingRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rentals" className="space-y-6">
            {rentalsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : myRentals && myRentals.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myRentals.map(({ property, request }) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    variant="rented"
                    rentalRequest={request}
                    onCancelRequest={() => cancelRequestMutation.mutate(request.id)}
                    isCancelling={cancelRequestMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="rental"
                title="Нет арендуемой недвижимости"
                description="Найдите подходящую недвижимость и отправьте запрос на аренду"
                actionLabel="Искать недвижимость"
                onAction={() => window.location.href = "/browse"}
              />
            )}
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Мои объекты</h2>
              <Button onClick={() => setPropertyFormOpen(true)} data-testid="button-add-property">
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </div>

            {propertiesLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : myProperties && myProperties.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    variant="owned"
                    onEdit={() => setEditingProperty(property)}
                    onDelete={() => setDeletingPropertyId(property.id)}
                    onManageTenant={() => setManagingTenantProperty(property)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="property"
                title="Нет добавленной недвижимости"
                description="Добавьте свою недвижимость, чтобы получать запросы на аренду"
                actionLabel="Добавить недвижимость"
                onAction={() => setPropertyFormOpen(true)}
              />
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <h2 className="text-xl font-semibold">Входящие запросы</h2>

            {requestsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <RequestCardSkeleton key={i} />
                ))}
              </div>
            ) : incomingRequests && incomingRequests.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {incomingRequests.map((request) => (
                  <RentalRequestCard
                    key={request.id}
                    request={request}
                    onApprove={() => handleRequestMutation.mutate({ id: request.id, status: "approved" })}
                    onReject={() => handleRequestMutation.mutate({ id: request.id, status: "rejected" })}
                    isProcessing={handleRequestMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="request"
                title="Нет входящих запросов"
                description="Когда кто-то захочет арендовать вашу недвижимость, вы увидите запрос здесь"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <PropertyForm
        open={propertyFormOpen}
        onOpenChange={setPropertyFormOpen}
        onSubmit={handleCreateProperty}
        isSubmitting={createPropertyMutation.isPending}
        mode="create"
      />

      <PropertyForm
        open={!!editingProperty}
        onOpenChange={(open) => !open && setEditingProperty(null)}
        onSubmit={handleUpdateProperty}
        isSubmitting={updatePropertyMutation.isPending}
        initialData={editingProperty}
        mode="edit"
      />

      <TenantManager
        property={managingTenantProperty}
        open={!!managingTenantProperty}
        onOpenChange={(open: boolean) => !open && setManagingTenantProperty(null)}
      />

      <AlertDialog open={!!deletingPropertyId} onOpenChange={(open) => !open && setDeletingPropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить недвижимость?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все связанные запросы на аренду также будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPropertyId && deletePropertyMutation.mutate(deletingPropertyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
