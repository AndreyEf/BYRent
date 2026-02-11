import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Phone } from "lucide-react";

interface PhoneVerificationAlertProps {
  className?: string;
}

export function PhoneVerificationAlert({ className }: PhoneVerificationAlertProps) {
  return (
    <Alert className={className} data-testid="alert-phone-verification">
      <Phone className="h-4 w-4" />
      <AlertTitle>Требуется подтверждение телефона</AlertTitle>
      <AlertDescription>
        Для добавления недвижимости, отправки заявок на аренду и добавления арендаторов необходимо подтвердить номер телефона.{" "}
        <Link href="/profile" className="text-primary hover:underline font-medium" data-testid="link-verify-phone">
          Подтвердить телефон
        </Link>
      </AlertDescription>
    </Alert>
  );
}
