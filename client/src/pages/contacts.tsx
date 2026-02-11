import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Contacts() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center" data-testid="text-contacts-title">
            Контакты
          </h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href="mailto:byrent.by@yandex.by" 
                className="text-lg text-primary hover:underline"
                data-testid="link-contact-email"
              >
                byrent.by@yandex.by
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Для вопросов и предложений
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Телефон
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href="tel:+375296076731" 
                className="text-lg text-primary hover:underline"
                data-testid="link-contact-phone"
              >
                +375 29 607-67-31
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Время работы: Пн-Пт 9:00 - 18:00
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Местоположение
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg" data-testid="text-location">
                Республика Беларусь
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Онлайн-сервис для аренды недвижимости
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
