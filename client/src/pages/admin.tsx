import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Building2, Key, Trash2, Ban, CheckCircle, CreditCard, Shield } from "lucide-react";
import { Redirect } from "wouter";
import type { User, PropertyWithOwner, SubscriptionPlan } from "@shared/schema";

type UserWithoutPassword = Omit<User, "password">;

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithoutPassword | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [changingPlanUser, setChangingPlanUser] = useState<UserWithoutPassword | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const { data: users, isLoading: usersLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<PropertyWithOwner[]>({
    queryKey: ["/api/admin/properties"],
    enabled: !!user?.isAdmin,
  });

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscriptions/plans"],
    enabled: !!user?.isAdmin,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`, { newPassword: password });
      return res.json();
    },
    onSuccess: () => {
      setResetPasswordUser(null);
      setNewPassword("");
      toast({
        title: "Пароль сброшен",
        description: "Новый пароль установлен для пользователя",
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

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      setDeletingPropertyId(null);
      toast({
        title: "Недвижимость удалена",
        description: "Объект успешно удалён из системы",
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

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/block`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Пользователь заблокирован",
        description: "Пользователь не сможет войти в систему",
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

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/unblock`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Пользователь разблокирован",
        description: "Пользователь снова может войти в систему",
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

  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/subscription/${planId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setChangingPlanUser(null);
      setSelectedPlanId("");
      toast({
        title: "Тариф изменён",
        description: "Тарифный план пользователя успешно обновлён",
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

  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-admin-title">
              Панель администратора
            </h1>
          </div>
          <p className="text-muted-foreground">
            Управление пользователями и объектами недвижимости
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Пользователи
              {users && (
                <Badge variant="secondary" className="ml-1">{users.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Недвижимость
              {properties && (
                <Badge variant="secondary" className="ml-1">{properties.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Все пользователи</CardTitle>
                <CardDescription>
                  Список всех зарегистрированных пользователей системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Имя</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Телефон</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id} className={u.isBlocked ? "opacity-60" : ""}>
                            <TableCell className="font-mono text-xs">{u.visibleId}</TableCell>
                            <TableCell>
                              {u.firstName} {u.lastName}
                            </TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{u.phone || "—"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {u.isAdmin && (
                                  <Badge variant="destructive">Админ</Badge>
                                )}
                                {u.isBlocked && (
                                  <Badge variant="outline" className="border-destructive text-destructive">
                                    Заблокирован
                                  </Badge>
                                )}
                                {!u.isAdmin && !u.isBlocked && (
                                  <Badge variant="secondary">Активен</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setResetPasswordUser(u)}
                                  title="Сбросить пароль"
                                  data-testid={`button-reset-password-${u.id}`}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setChangingPlanUser(u);
                                    setSelectedPlanId("");
                                  }}
                                  title="Изменить тариф"
                                  data-testid={`button-change-plan-${u.id}`}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                                {!u.isAdmin && (
                                  u.isBlocked ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => unblockUserMutation.mutate(u.id)}
                                      disabled={unblockUserMutation.isPending}
                                      title="Разблокировать"
                                      data-testid={`button-unblock-${u.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => blockUserMutation.mutate(u.id)}
                                      disabled={blockUserMutation.isPending}
                                      title="Заблокировать"
                                      data-testid={`button-block-${u.id}`}
                                    >
                                      <Ban className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Нет зарегистрированных пользователей
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Все объекты недвижимости</CardTitle>
                <CardDescription>
                  Список всех объектов недвижимости в системе
                </CardDescription>
              </CardHeader>
              <CardContent>
                {propertiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : properties && properties.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Адрес</TableHead>
                          <TableHead>Собственник</TableHead>
                          <TableHead>Кадастровый №</TableHead>
                          <TableHead>Владелец аккаунта</TableHead>
                          <TableHead>Аренда</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="max-w-[200px] truncate">
                              {p.city}, {p.street}, {p.building}{p.apartment ? `, кв. ${p.apartment}` : ""}
                            </TableCell>
                            <TableCell>{p.ownerFullName}</TableCell>
                            <TableCell className="font-mono text-xs">{p.cadastralNumber}</TableCell>
                            <TableCell>
                              {p.owner.firstName} {p.owner.lastName}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({p.owner.visibleId})
                              </span>
                            </TableCell>
                            <TableCell>
                              {p.rentPrice ? `${new Intl.NumberFormat("ru-RU").format(p.rentPrice)} BYN` : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {!p.isActive && (
                                  <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                                    Неактивен
                                  </Badge>
                                )}
                                {p.isActive && !p.isVisible && (
                                  <Badge variant="secondary">Скрыт</Badge>
                                )}
                                {p.isActive && p.isVisible && (
                                  <Badge variant="default">Активен</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingPropertyId(p.id)}
                                data-testid={`button-delete-property-${p.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Нет объектов недвижимости
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сброс пароля</DialogTitle>
            <DialogDescription>
              Установите новый пароль для пользователя {resetPasswordUser?.firstName} {resetPasswordUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                data-testid="input-admin-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordUser(null);
                setNewPassword("");
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (resetPasswordUser && newPassword.length >= 6) {
                  resetPasswordMutation.mutate({
                    userId: resetPasswordUser.id,
                    password: newPassword,
                  });
                }
              }}
              disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Сбросить пароль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!changingPlanUser} onOpenChange={(open) => !open && setChangingPlanUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить тариф</DialogTitle>
            <DialogDescription>
              Выберите новый тарифный план для пользователя {changingPlanUser?.firstName} {changingPlanUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Тарифный план</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger data-testid="select-plan">
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.propertyLimit === -1 ? "Безлимит" : `до ${plan.propertyLimit} объектов`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangingPlanUser(null);
                setSelectedPlanId("");
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (changingPlanUser && selectedPlanId) {
                  changePlanMutation.mutate({
                    userId: changingPlanUser.id,
                    planId: selectedPlanId,
                  });
                }
              }}
              disabled={!selectedPlanId || changePlanMutation.isPending}
              data-testid="button-confirm-change-plan"
            >
              {changePlanMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Изменить тариф
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPropertyId} onOpenChange={(open) => !open && setDeletingPropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить недвижимость?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Объект будет полностью удален из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPropertyId && deletePropertyMutation.mutate(deletingPropertyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
