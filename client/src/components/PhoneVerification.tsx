import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { initRecaptcha, sendVerificationCode, verifyCode, clearRecaptcha } from "@/lib/firebase";
import { CheckCircle, Phone, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PhoneVerificationProps {
  currentPhone?: string | null;
  isVerified?: boolean;
  onVerified?: () => void;
}

export function PhoneVerification({ currentPhone, isVerified, onVerified }: PhoneVerificationProps) {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const phone = currentPhone || "";

  useEffect(() => {
    const timer = setTimeout(() => {
      initRecaptcha("recaptcha-container");
    }, 100);
    return () => {
      clearTimeout(timer);
      clearRecaptcha();
    };
  }, []);

  const handleSendCode = async () => {
    if (!phone) {
      toast({ title: "Ошибка", description: "Сначала укажите номер телефона в профиле и сохраните изменения", variant: "destructive" });
      return;
    }

    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone;
    }

    setIsLoading(true);
    try {
      await sendVerificationCode(formattedPhone);
      setStep("code");
      toast({ title: "Код отправлен", description: "Код подтверждения отправлен на ваш телефон" });
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Не удалось отправить код подтверждения", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({ title: "Ошибка", description: "Введите 6-значный код", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await verifyCode(code);
      
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone;
      }
      
      await apiRequest("POST", "/api/users/me/verify-phone", { phone: formattedPhone });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({ title: "Успешно", description: "Номер телефона подтверждён" });
      onVerified?.();
    } catch (error: any) {
      toast({ 
        title: "Ошибка", 
        description: error.message || "Неверный код подтверждения", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Подтверждение телефона
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Телефон подтверждён: {currentPhone}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Подтверждение телефона
        </CardTitle>
        <CardDescription>
          Подтвердите номер телефона для доступа ко всем функциям
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "phone" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Номер телефона</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+375291234567"
                value={phone}
                disabled
                className="bg-muted"
                data-testid="input-phone-readonly"
              />
              {!phone && (
                <p className="text-sm text-destructive">
                  Сначала укажите номер телефона в профиле выше и сохраните изменения
                </p>
              )}
              {phone && (
                <p className="text-sm text-muted-foreground">
                  На этот номер будет отправлен код подтверждения
                </p>
              )}
            </div>
            <Button 
              onClick={handleSendCode} 
              disabled={isLoading || !phone}
              data-testid="button-send-code"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Отправить код
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">Код подтверждения</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                data-testid="input-verification-code"
              />
              <p className="text-sm text-muted-foreground">
                Введите 6-значный код, отправленный на {phone}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => { setStep("phone"); setCode(""); }}
                data-testid="button-back"
              >
                Назад
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={isLoading}
                data-testid="button-verify-code"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Подтвердить
              </Button>
            </div>
          </>
        )}
        <div id="recaptcha-container"></div>
      </CardContent>
    </Card>
  );
}
