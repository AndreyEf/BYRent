import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, User, Star, Loader2, Phone, Mail, Hash, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { User as UserType } from "@shared/schema";

interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  propertyId?: string;
  reviewType: "landlord" | "tenant";
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    visibleId: string;
  };
}

export default function Reviews() {
  const urlSearch = useSearch();
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(urlSearch);
  const urlValue = urlParams.get("value") || urlParams.get("search") || "";
  const urlType = (urlParams.get("type") as "visibleId" | "email" | "phone") || "visibleId";
  
  const [searchType, setSearchType] = useState<"visibleId" | "email" | "phone">(urlType);
  const [searchValue, setSearchValue] = useState(urlValue);
  const [searchParams, setSearchParams] = useState<{ type: string; value: string } | null>(
    urlValue ? { type: urlType, value: urlValue } : null
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (urlValue) {
      const currentValue = searchParams?.value;
      const currentType = searchParams?.type;
      if (urlValue !== currentValue || urlType !== currentType) {
        setSearchValue(urlValue);
        setSearchType(urlType);
        setSearchParams({ type: urlType, value: urlValue });
      }
    }
  }, [urlValue, urlType]);

  const { data: foundUser, isLoading: isSearching, error } = useQuery<Omit<UserType, "password">>({
    queryKey: ["/api/users/search", searchParams],
    queryFn: async () => {
      if (!searchParams) return null;
      const params = new URLSearchParams();
      params.set(searchParams.type, searchParams.value);
      const res = await fetch(`/api/users/search?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Пользователь не найден");
        throw new Error("Ошибка поиска");
      }
      return res.json();
    },
    enabled: !!searchParams,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews/user", foundUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/user/${foundUser!.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!foundUser?.id,
  });

  const { data: ratingData } = useQuery<{ rating: number }>({
    queryKey: ["/api/reviews/rating", foundUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/rating/${foundUser!.id}`);
      if (!res.ok) return { rating: 0 };
      return res.json();
    },
    enabled: !!foundUser?.id,
  });

  const handleSearch = () => {
    setValidationError(null);
    const trimmedValue = searchValue.trim();
    if (!trimmedValue) {
      setValidationError("Введите значение для поиска");
      return;
    }
    setSearchParams({ type: searchType, value: trimmedValue });
    setLocation(`/reviews?type=${searchType}&value=${encodeURIComponent(trimmedValue)}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getInitials = (user: Omit<UserType, "password">) => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case "visibleId":
        return "Введите ID пользователя (например, AB12CD)";
      case "email":
        return "Введите email";
      case "phone":
        return "Введите номер телефона";
      default:
        return "";
    }
  };

  const landlordReviews = reviews?.filter(r => r.reviewType === "landlord") || [];
  const tenantReviews = reviews?.filter(r => r.reviewType === "tenant") || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
              Поиск пользователей
            </h1>
            <p className="text-muted-foreground">
              Найдите пользователя и просмотрите его отзывы
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Поиск
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={searchType} onValueChange={(v) => setSearchType(v as typeof searchType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="visibleId" className="flex items-center gap-2" data-testid="tab-search-id">
                    <Hash className="h-4 w-4" />
                    По ID
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2" data-testid="tab-search-email">
                    <Mail className="h-4 w-4" />
                    По Email
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2" data-testid="tab-search-phone">
                    <Phone className="h-4 w-4" />
                    По телефону
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2">
                <Input
                  placeholder={getPlaceholder()}
                  value={searchValue}
                  onChange={(e) => { setSearchValue(e.target.value); setValidationError(null); }}
                  onKeyPress={handleKeyPress}
                  data-testid="input-search"
                />
                <Button onClick={handleSearch} disabled={isSearching || !searchValue.trim()} data-testid="button-search">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {validationError && (
                <p className="text-sm text-destructive text-center" data-testid="text-validation-error">
                  {validationError}
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive text-center" data-testid="text-error">
                  {(error as Error).message}
                </p>
              )}
            </CardContent>
          </Card>

          {foundUser && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(foundUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-semibold" data-testid="text-user-name">
                          {foundUser.firstName} {foundUser.lastName}
                        </h2>
                        {foundUser.userType === "organization" && (
                          <Badge variant="secondary" data-testid="badge-organization">
                            <Building2 className="h-3 w-3 mr-1" />
                            Организация
                          </Badge>
                        )}
                      </div>
                      {foundUser.organizationName && (
                        <p className="text-muted-foreground" data-testid="text-organization-name">
                          {foundUser.organizationName}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="font-mono" data-testid="text-visible-id">ID: {foundUser.visibleId}</span>
                        {ratingData && ratingData.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span data-testid="text-rating">{ratingData.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Tabs defaultValue="about-landlord" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="about-landlord" data-testid="tab-landlord-reviews">
                    Как арендодатель ({landlordReviews.length})
                  </TabsTrigger>
                  <TabsTrigger value="about-tenant" data-testid="tab-tenant-reviews">
                    Как арендатор ({tenantReviews.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about-landlord">
                  {reviewsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : landlordReviews.length > 0 ? (
                    <div className="space-y-4">
                      {landlordReviews.map((review) => (
                        <Card key={review.id} data-testid={`card-review-${review.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {review.reviewer?.firstName} {review.reviewer?.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(review.createdAt), "d MMMM yyyy", { locale: ru })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Нет отзывов как об арендодателе</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="about-tenant">
                  {reviewsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : tenantReviews.length > 0 ? (
                    <div className="space-y-4">
                      {tenantReviews.map((review) => (
                        <Card key={review.id} data-testid={`card-review-${review.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {review.reviewer?.firstName} {review.reviewer?.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(review.createdAt), "d MMMM yyyy", { locale: ru })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Нет отзывов как об арендаторе</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
