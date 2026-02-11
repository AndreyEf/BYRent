import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatPriceByn } from "@/lib/utils";
import { Check, Crown, Building2, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { SubscriptionPlan, UserSubscriptionWithPlan } from "@shared/schema";

interface ExchangeRate {
  currency: string;
  rate: number;
  baseCurrency: string;
}

interface SubscriptionInfo {
  subscription: UserSubscriptionWithPlan | null;
  propertyCount: number;
  propertyLimit: number;
}

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscriptions/plans"],
  });

  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscriptions/my"],
    enabled: !!user,
  });

  const { data: exchangeRate } = useQuery<ExchangeRate>({
    queryKey: ["/api/exchange-rate"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("POST", "/api/subscriptions/activate", { planId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/my"] });
      toast({
        title: "Подписка активирована",
        description: "Ваш тариф успешно обновлён",
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

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscriptions/cancel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/my"] });
      toast({
        title: "Подписка отменена",
        description: "Вы перешли на бесплатный тариф",
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

  const currentPlanId = subscriptionInfo?.subscription?.planId || "free";
  const propertyCount = subscriptionInfo?.propertyCount || 0;
  const propertyLimit = subscriptionInfo?.propertyLimit === -1 ? Infinity : (subscriptionInfo?.propertyLimit || 1);
  const progressPercent = propertyLimit === Infinity ? 0 : (propertyCount / propertyLimit) * 100;
  const usdRate = exchangeRate?.rate;
  const isOrganization = user?.userType === "organization";

  const filteredPlans = plans?.filter(plan => {
    if (isOrganization) {
      return plan.id.endsWith("_org");
    } else {
      return !plan.id.endsWith("_org");
    }
  });

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "premium":
      case "premium_org":
        return <Crown className="h-6 w-6 text-yellow-500" />;
      default:
        return <Building2 className="h-6 w-6" />;
    }
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = [];
    if (plan.propertyLimit === -1) {
      features.push("Неограниченное количество объектов");
    } else {
      features.push(`До ${plan.propertyLimit} ${plan.propertyLimit === 1 ? "объекта" : plan.propertyLimit <= 4 ? "объектов" : "объектов"}`);
    }
    if (plan.price > 0) {
      features.push("Приоритетная поддержка");
    }
    return features;
  };

  const isLoading = plansLoading || subscriptionLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Тарифные планы</h1>
            <p className="text-muted-foreground">
              {isOrganization 
                ? "Тарифы для юридических лиц"
                : "Выберите подходящий тариф для управления вашей недвижимостью"
              }
            </p>
            {isOrganization && (
              <Badge variant="secondary" className="mt-2">Юридическое лицо</Badge>
            )}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Текущее использование
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Объектов: {propertyCount}</span>
                  <span>Лимит: {propertyLimit === Infinity ? "Безлимит" : propertyLimit}</span>
                </div>
                {propertyLimit !== Infinity && (
                  <Progress value={progressPercent} className="h-2" data-testid="progress-property-usage" />
                )}
                {propertyLimit !== Infinity && progressPercent >= 80 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Вы приближаетесь к лимиту. Рассмотрите обновление тарифа.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredPlans?.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isDowngrade = plan.price < (subscriptionInfo?.subscription?.plan?.price || 0);
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${isCurrent ? "border-primary border-2" : ""}`}
                  data-testid={`card-plan-${plan.id}`}
                >
                  {isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Текущий
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-2">
                      {getPlanIcon(plan.id)}
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-foreground">
                      {formatPriceByn(plan.price, usdRate)}/мес
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {getPlanFeatures(plan).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isCurrent ? (
                      plan.id !== "free" ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                          data-testid={`button-cancel-${plan.id}`}
                        >
                          {cancelMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Отменить подписку
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Активен
                        </Button>
                      )
                    ) : (
                      <Button 
                        className="w-full"
                        variant={isDowngrade ? "outline" : "default"}
                        onClick={() => subscribeMutation.mutate(plan.id)}
                        disabled={subscribeMutation.isPending}
                        data-testid={`button-select-${plan.id}`}
                      >
                        {subscribeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {isDowngrade ? "Понизить" : "Выбрать"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Это демо-режим. В реальном приложении здесь будет интеграция с платёжной системой.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
