import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "byrent_cookie_consent";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="max-w-2xl mx-auto shadow-lg border bg-card">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-2" data-testid="text-cookie-title">
                  Использование файлов cookie
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-cookie-description">
                  Мы используем файлы cookie для обеспечения работы сайта и сбора аналитики 
                  с помощью Яндекс Метрики. Продолжая использовать сайт, вы соглашаетесь с{" "}
                  <Link 
                    href="/privacy-policy" 
                    className="text-primary hover:underline"
                    data-testid="link-cookie-privacy"
                  >
                    политикой обработки персональных данных
                  </Link>.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 -mt-1 -mr-1"
                onClick={handleDecline}
                data-testid="button-cookie-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecline}
                data-testid="button-cookie-decline"
              >
                Отклонить
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                data-testid="button-cookie-accept"
              >
                Принять
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
