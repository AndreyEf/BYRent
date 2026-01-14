import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { updateUserSchema, changePasswordSchema } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { ReviewForm } from "@/components/review-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Phone, Copy, Check, Pencil, Key, History, Star, CheckCircle, AlertCircle } from "lucide-react";
import { z } from "zod";
import type { TenantHistoryWithDetails, ReviewWithDetails } from "@shared/schema";
import { PhoneVerification } from "@/components/PhoneVerification";

const profileFormSchema = updateUserSchema.extend({
  firstName: z.string().min(1, "Введите имя"),
  lastName: z.string().min(1, "Введите фамилию"),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [reviewingLandlord, setReviewingLandlord] = useState<TenantHistoryWithDetails | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const { data: landlordHistory } = useQuery<TenantHistoryWithDetails[]>({
    queryKey: ["/api/landlord-history"],
  });

  const { data: myReviews } = useQuery<ReviewWithDetails[]>({
    queryKey: ["/api/reviews/user", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/reviews/user/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setIsEditing(false);
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
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

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const res = await apiRequest("POST", "/api/users/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      setPasswordDialogOpen(false);
      passwordForm.reset();
      toast({
        title: "Пароль изменён",
        description: "Ваш пароль успешно обновлён",
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

  const handleCopyId = async () => {
    if (user?.visibleId) {
      await navigator.clipboard.writeText(user.visibleId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "ID скопирован",
        description: "Ваш ID скопирован в буфер обмена",
      });
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  const handlePasswordSubmit = (data: ChangePasswordData) => {
    changePasswordMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-profile-title">Профиль</h1>
          <p className="text-muted-foreground">
            Управляйте своими личными данными
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl" data-testid="text-user-fullname">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </CardDescription>
                    {user.isAdmin && (
                      <Badge variant="destructive" className="mt-2">Администратор</Badge>
                    )}
                  </div>
                </div>
                
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                    <Pencil className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mb-6">
                <span className="text-sm text-muted-foreground">Ваш ID:</span>
                <Badge variant="secondary" className="font-mono text-sm" data-testid="text-user-id">
                  {user.visibleId}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 ml-auto"
                  onClick={handleCopyId}
                  data-testid="button-copy-id"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Фамилия</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""} 
                              placeholder="+7 (999) 123-45-67"
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={handleCancel}
                        data-testid="button-cancel-edit"
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={updateMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Сохранить
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Имя</p>
                      <p className="font-medium">{user.firstName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Фамилия</p>
                      <p className="font-medium">{user.lastName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Телефон</p>
                      <p className="font-medium">{user.phone || "Не указан"}</p>
                    </div>
                    {user.phone && (
                      user.phoneVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Подтверждён
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Не подтверждён
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {!user.phoneVerified && (
                <div className="mb-6">
                  <PhoneVerification 
                    currentPhone={user.phone} 
                    isVerified={user.phoneVerified}
                    onVerified={() => updateUser({ ...user, phoneVerified: true })}
                  />
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPasswordDialogOpen(true)}
                data-testid="button-change-password"
              >
                <Key className="h-4 w-4 mr-2" />
                Изменить пароль
              </Button>
            </CardContent>
          </Card>

          {landlordHistory && landlordHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  История аренды
                </CardTitle>
                <CardDescription>
                  Объекты, которые вы арендовали ранее
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {landlordHistory.map((entry) => (
                  <div key={entry.id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{entry.property.address}</p>
                        <p className="text-sm text-muted-foreground">
                          Владелец: {entry.property.ownerFullName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(entry.startDate)}
                          {entry.endDate ? ` — ${formatDate(entry.endDate)}` : " — настоящее время"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setReviewingLandlord(entry)}
                        title="Оставить отзыв"
                        data-testid={`button-review-landlord-${entry.property.id}`}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {myReviews && myReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Отзывы обо мне
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {myReviews.map((review) => (
                  <div key={review.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        {review.reviewer.firstName} {review.reviewer.lastName}
                      </p>
                      {renderStars(review.rating)}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(review.createdAt)} • {review.reviewType === "landlord" ? "Как арендодатель" : "Как арендатор"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить пароль</DialogTitle>
            <DialogDescription>
              Введите текущий пароль и новый пароль
            </DialogDescription>
          </DialogHeader>

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Текущий пароль</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} data-testid="input-current-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Новый пароль</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} data-testid="input-new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPasswordDialogOpen(false);
                    passwordForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-submit-password"
                >
                  {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Изменить
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {reviewingLandlord && (
        <ReviewForm
          open={!!reviewingLandlord}
          onOpenChange={(open) => !open && setReviewingLandlord(null)}
          revieweeId={reviewingLandlord.property.ownerId}
          revieweeName={reviewingLandlord.property.ownerFullName}
          propertyId={reviewingLandlord.property.id}
          reviewType="landlord"
        />
      )}
    </div>
  );
}
