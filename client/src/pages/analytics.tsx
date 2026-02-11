import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Building2, TrendingUp, Users, Banknote, Home, Calendar, Loader2 } from "lucide-react";
import type { PropertyWithOwner, TenantHistoryWithDetails } from "@shared/schema";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Analytics() {
  const { user } = useAuth();

  const { data: myProperties, isLoading: propertiesLoading } = useQuery<PropertyWithOwner[]>({
    queryKey: ["/api/properties/my"],
  });

  const { data: tenantHistory, isLoading: historyLoading } = useQuery<TenantHistoryWithDetails[]>({
    queryKey: ["/api/landlord-history"],
    enabled: !!user,
  });

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("ru-RU").format(value) + " BYN";
  };

  const stats = useMemo(() => {
    if (!myProperties) return null;

    const totalProperties = myProperties.length;
    const occupiedProperties = myProperties.filter(p => p.currentTenantId).length;
    const vacantProperties = totalProperties - occupiedProperties;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

    const totalMonthlyIncome = myProperties
      .filter(p => p.currentTenantId && p.rentPrice)
      .reduce((sum, p) => sum + (p.rentPrice || 0), 0);

    const potentialMonthlyIncome = myProperties
      .filter(p => p.rentPrice)
      .reduce((sum, p) => sum + (p.rentPrice || 0), 0);

    const avgRentPrice = totalProperties > 0
      ? myProperties.filter(p => p.rentPrice).reduce((sum, p) => sum + (p.rentPrice || 0), 0) / 
        myProperties.filter(p => p.rentPrice).length
      : 0;

    return {
      totalProperties,
      occupiedProperties,
      vacantProperties,
      occupancyRate,
      totalMonthlyIncome,
      potentialMonthlyIncome,
      avgRentPrice,
    };
  }, [myProperties]);

  const propertiesByCity = useMemo(() => {
    if (!myProperties) return [];
    
    const cityMap = new Map<string, number>();
    myProperties.forEach(p => {
      const count = cityMap.get(p.city) || 0;
      cityMap.set(p.city, count + 1);
    });
    
    return Array.from(cityMap.entries()).map(([city, count]) => ({
      city,
      count,
    }));
  }, [myProperties]);

  const incomeByProperty = useMemo(() => {
    if (!myProperties) return [];
    
    return myProperties
      .filter(p => p.rentPrice)
      .map(p => ({
        name: `${p.city}, ${p.street}`.substring(0, 20) + (p.street.length > 20 ? "..." : ""),
        income: p.rentPrice || 0,
        isOccupied: !!p.currentTenantId,
      }))
      .sort((a, b) => b.income - a.income)
      .slice(0, 10);
  }, [myProperties]);

  const occupancyData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Занято", value: stats.occupiedProperties, fill: "hsl(var(--primary))" },
      { name: "Свободно", value: stats.vacantProperties, fill: "hsl(var(--muted-foreground))" },
    ].filter(d => d.value > 0);
  }, [stats]);

  const isLoading = propertiesLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!myProperties || myProperties.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Нет данных для аналитики</h2>
            <p className="text-muted-foreground">
              Добавьте объекты недвижимости, чтобы увидеть статистику
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Аналитика</h1>
          <p className="text-muted-foreground">
            Статистика по вашим объектам недвижимости
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card data-testid="card-total-properties">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего объектов</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-occupancy">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Заполняемость</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.occupancyRate.toFixed(0) || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {stats?.occupiedProperties || 0} из {stats?.totalProperties || 0} занято
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-monthly-income">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Доход в месяц</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats?.totalMonthlyIncome || 0)} ₽
              </div>
              <p className="text-xs text-muted-foreground">
                Потенциал: {formatPrice(stats?.potentialMonthlyIncome || 0)} ₽
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-rent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средняя цена</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(Math.round(stats?.avgRentPrice || 0))} ₽
              </div>
              <p className="text-xs text-muted-foreground">в месяц</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card data-testid="card-income-chart">
            <CardHeader>
              <CardTitle>Доход по объектам</CardTitle>
              <CardDescription>Топ-10 объектов по стоимости аренды</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeByProperty.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeByProperty} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${formatPrice(value)} ₽`, "Аренда"]}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar 
                      dataKey="income" 
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Нет данных о ценах аренды
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-occupancy-chart">
            <CardHeader>
              <CardTitle>Статус объектов</CardTitle>
              <CardDescription>Занятые и свободные объекты</CardDescription>
            </CardHeader>
            <CardContent>
              {occupancyData.length > 0 ? (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={occupancyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {occupancyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, ""]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Нет данных
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-cities">
            <CardHeader>
              <CardTitle>Распределение по городам</CardTitle>
              <CardDescription>Количество объектов в каждом городе</CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesByCity.length > 0 ? (
                <div className="space-y-3">
                  {propertiesByCity.map(({ city, count }) => (
                    <div key={city} className="flex items-center justify-between">
                      <span className="font-medium">{city}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Нет данных
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-properties-list">
            <CardHeader>
              <CardTitle>Мои объекты</CardTitle>
              <CardDescription>Краткий обзор недвижимости</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {myProperties.map(property => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    data-testid={`row-property-${property.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {property.fullAddress || `${property.city}, ${property.street}, д. ${property.building}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {property.rentPrice ? `${formatPrice(property.rentPrice)} ₽/мес` : "Цена не указана"}
                      </p>
                    </div>
                    <Badge 
                      variant={property.currentTenantId ? "default" : "secondary"}
                      className={property.currentTenantId ? "bg-green-600" : ""}
                    >
                      {property.currentTenantId ? "Занято" : "Свободно"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
