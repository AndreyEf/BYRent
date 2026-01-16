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
import { Loader2, Users, Building2, Key, Trash2, Ban, CheckCircle, CreditCard, Shield, Mail, Save, Edit } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Redirect } from "wouter";
import type { User, PropertyWithOwner, SubscriptionPlan } from "@shared/schema";

type UserWithoutPassword = Omit<User, "password">;

interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithoutPassword | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [changingPlanUser, setChangingPlanUser] = useState<UserWithoutPassword | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

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

  const { data: emailTemplates, isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-templates");
      if (!res.ok) return [];
      return res.json();
    },
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

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const payload: Record<string, unknown> = {
        name: template.name,
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
      };
      if (template.description !== null && template.description !== undefined) {
        payload.description = template.description;
      }
      const res = await apiRequest("PATCH", `/api/admin/email-templates/${template.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setEditingTemplate(null);
      toast({
        title: "Шаблон сохранён",
        description: "Изменения успешно сохранены",
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
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email-шаблоны
              {emailTemplates && (
                <Badge variant="secondary" className="ml-1">{emailTemplates.length}</Badge>
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

          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle>Шаблоны email-уведомлений</CardTitle>
                <CardDescription>
                  Редактирование шаблонов писем для уведомлений пользователей.
                  Используйте переменные в формате {"{{переменная}}"} для подстановки данных.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : emailTemplates && emailTemplates.length > 0 ? (
                  <div className="space-y-4">
                    {emailTemplates.map((template) => (
                      <Card key={template.id} className={!template.isActive ? "opacity-60" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription className="font-mono text-xs">
                                Код: {template.code}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={template.isActive ? "default" : "secondary"}>
                                {template.isActive ? "Активен" : "Отключён"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingTemplate({ ...template })}
                                data-testid={`button-edit-template-${template.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Тема:</span> {template.subject}
                            </div>
                            {template.description && (
                              <div className="text-muted-foreground">
                                {template.description}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Нет email-шаблонов
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

      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование шаблона</DialogTitle>
            <DialogDescription>
              {editingTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label>Активен</Label>
                <Switch
                  checked={editingTemplate.isActive}
                  onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, isActive: checked })}
                  data-testid="switch-template-active"
                />
              </div>
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Тема письма</Label>
                <Input
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  data-testid="input-template-subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Текст письма</Label>
                <Textarea
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  className="min-h-[200px] font-mono text-sm"
                  data-testid="textarea-template-body"
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (для администратора)</Label>
                <Textarea
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="min-h-[60px]"
                  data-testid="textarea-template-description"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Отмена
            </Button>
            <Button
              onClick={() => editingTemplate && updateTemplateMutation.mutate(editingTemplate)}
              disabled={updateTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {updateTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
