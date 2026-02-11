import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ReviewForm } from "@/components/review-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Search, History, UserMinus, Loader2, Star } from "lucide-react";
import type { PropertyWithOwner, TenantHistoryWithDetails, User as UserType } from "@shared/schema";

interface TenantManagerProps {
  property: PropertyWithOwner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantManager({ property, open, onOpenChange }: TenantManagerProps) {
  const { toast } = useToast();
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<Omit<UserType, "password"> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [reviewingTenant, setReviewingTenant] = useState<TenantHistoryWithDetails | null>(null);

  const { data: tenantHistory, isLoading: historyLoading } = useQuery<TenantHistoryWithDetails[]>({
    queryKey: ["/api/tenant-history/property", property?.id],
    queryFn: async () => {
      if (!property?.id) return [];
      const res = await fetch(`/api/tenant-history/property/${property.id}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: !!property?.id && open,
  });

  const setTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const res = await apiRequest("POST", `/api/properties/${property?.id}/tenant`, { tenantId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-history/property", property?.id] });
      setFoundUser(null);
      setSearchId("");
      toast({
        title: "Арендатор добавлен",
        description: "Арендатор успешно назначен для объекта",
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

  const removeTenantMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/properties/${property?.id}/remove-tenant`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-history/property", property?.id] });
      setConfirmRemove(false);
      toast({
        title: "Арендатор удалён",
        description: "Арендатор успешно удалён из объекта",
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

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search/${searchId.trim().toUpperCase()}`);
      if (res.ok) {
        const user = await res.json();
        setFoundUser(user);
      } else {
        setFoundUser(null);
        toast({
          title: "Пользователь не найден",
          description: "Проверьте правильность ID пользователя",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка поиска",
        description: "Не удалось выполнить поиск",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!property) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Управление арендатором</DialogTitle>
            <DialogDescription>
              {property.fullAddress || `${property.city}, ${property.street}, ${property.building}`}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="add" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {property.currentTenantId ? "Текущий" : "Добавить"}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                История
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-4">
              {property.currentTenantId ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      Текущий арендатор
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Объект сейчас арендуется. Чтобы добавить нового арендатора, сначала удалите текущего.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmRemove(true)}
                      disabled={removeTenantMutation.isPending}
                      data-testid="button-remove-tenant"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      {removeTenantMutation.isPending ? "Удаление..." : "Удалить арендатора"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Поиск по ID пользователя</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="XXXXXXXX"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="font-mono uppercase"
                        data-testid="input-search-tenant-id"
                      />
                      <Button 
                        onClick={handleSearch} 
                        disabled={isSearching || !searchId.trim()}
                        data-testid="button-search-tenant"
                      >
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Введите 8-символьный ID пользователя, который хотите добавить как арендатора
                    </p>
                  </div>

                  {foundUser && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Найден пользователь</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Имя: </span>
                          <span className="font-medium">{foundUser.firstName} {foundUser.lastName}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Email: </span>
                          <span className="font-medium">{foundUser.email}</span>
                        </div>
                        {foundUser.phone && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Телефон: </span>
                            <span className="font-medium">{foundUser.phone}</span>
                          </div>
                        )}
                        <Button
                          className="w-full mt-2"
                          onClick={() => setTenantMutation.mutate(foundUser.id)}
                          disabled={setTenantMutation.isPending}
                          data-testid="button-add-tenant"
                        >
                          {setTenantMutation.isPending ? "Добавление..." : "Добавить как арендатора"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tenantHistory && tenantHistory.length > 0 ? (
                <div className="space-y-3">
                  {tenantHistory.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {entry.tenant.firstName} {entry.tenant.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entry.tenant.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!entry.endDate && (
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                Текущий
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setReviewingTenant(entry)}
                              title="Оставить отзыв"
                              data-testid={`button-review-tenant-${entry.tenant.id}`}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatDate(entry.startDate)}
                          {entry.endDate ? ` — ${formatDate(entry.endDate)}` : " — настоящее время"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>История арендаторов пуста</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить арендатора?</AlertDialogTitle>
            <AlertDialogDescription>
              Арендатор будет удалён из объекта. Запись сохранится в истории.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTenantMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {reviewingTenant && property && (
        <ReviewForm
          open={!!reviewingTenant}
          onOpenChange={(open) => !open && setReviewingTenant(null)}
          revieweeId={reviewingTenant.tenant.id}
          revieweeName={`${reviewingTenant.tenant.firstName} ${reviewingTenant.tenant.lastName}`}
          propertyId={property.id}
          reviewType="tenant"
        />
      )}
    </>
  );
}
