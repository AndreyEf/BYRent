import { Link } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { 
  Building2, 
  Users, 
  Shield, 
  FileText, 
  Star, 
  ArrowRight,
  CheckCircle,
  Search,
  Home as HomeIcon,
  UserCheck
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      icon: Building2,
      title: "Управление недвижимостью",
      description: "Добавляйте объекты, отслеживайте арендаторов и управляйте платежами в одном месте"
    },
    {
      icon: Users,
      title: "Система арендаторов",
      description: "Ведите историю аренды, добавляйте и удаляйте арендаторов с полной историей"
    },
    {
      icon: FileText,
      title: "Запросы на аренду",
      description: "Принимайте и обрабатывайте заявки на аренду от потенциальных арендаторов"
    },
    {
      icon: Star,
      title: "Система отзывов",
      description: "Оценивайте арендаторов и арендодателей для формирования репутации"
    },
    {
      icon: Shield,
      title: "Безопасность данных",
      description: "Надёжное хранение информации о платежах и контактных данных"
    },
    {
      icon: Search,
      title: "Поиск недвижимости",
      description: "Находите подходящие объекты для аренды с удобными фильтрами"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Зарегистрируйтесь",
      description: "Создайте аккаунт за пару минут"
    },
    {
      number: "2",
      title: "Добавьте недвижимость",
      description: "Опишите ваш объект и укажите условия"
    },
    {
      number: "3",
      title: "Получайте запросы",
      description: "Арендаторы смогут найти вас и отправить заявку"
    },
    {
      number: "4",
      title: "Управляйте арендой",
      description: "Ведите учёт арендаторов и платежей"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <Header />
      
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-accent/5 py-20 lg:py-32">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" data-testid="text-hero-title">
              Управляйте арендой{" "}
              <span className="text-primary">просто и удобно</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl" data-testid="text-hero-description">
              RentFlow — платформа для арендодателей и арендаторов. 
              Добавляйте объекты, находите жильё, управляйте платежами и ведите историю аренды в одном месте.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-go-to-dashboard">
                    Перейти в кабинет
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto" data-testid="button-register-hero">
                      Начать бесплатно
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-login-hero">
                      Уже есть аккаунт
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section className="py-16 lg:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-features-title">
              Всё для управления арендой
            </h2>
            <p className="text-muted-foreground">
              Полный набор инструментов для арендодателей и арендаторов
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border bg-card hover-elevate transition-all">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16 lg:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Как это работает</h2>
            <p className="text-muted-foreground">
              Простой путь от регистрации до управления арендой
            </p>
          </div>
          
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  <h3 className="mb-2 font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Для арендодателей</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Добавляйте неограниченное количество объектов</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Храните информацию о платежах и счетах</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Ведите полную историю арендаторов</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Получайте и обрабатывайте запросы на аренду</span>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4">Для арендаторов</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Ищите недвижимость среди доступных объектов</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Отправляйте запросы на аренду владельцам</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Просматривайте платёжную информацию от владельца</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Оставляйте отзывы о владельцах</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <section className="bg-primary py-16 lg:py-20">
          <div className="container px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                Начните управлять арендой уже сегодня
              </h2>
              <p className="text-primary-foreground/80 mb-8">
                Регистрация бесплатна и занимает всего пару минут
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto" data-testid="button-register-cta">
                    Создать аккаунт
                    <UserCheck className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t py-8">
        <div className="container px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <HomeIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">RentFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Платформа управления арендой недвижимости
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
