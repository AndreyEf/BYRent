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
  const [phone, setPhone] = useState(currentPhone || "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      toast({ title: "Error", description: "Please enter a phone number", variant: "destructive" });
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
      toast({ title: "Code Sent", description: "Verification code sent to your phone" });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send verification code", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({ title: "Error", description: "Please enter a 6-digit code", variant: "destructive" });
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
      
      toast({ title: "Success", description: "Phone verified successfully" });
      onVerified?.();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Invalid verification code", 
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
            Phone Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Phone verified: {currentPhone}</span>
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
          Phone Verification
        </CardTitle>
        <CardDescription>
          Verify your phone number to increase trust
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "phone" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+375291234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
              <p className="text-sm text-muted-foreground">
                Enter your phone number with country code (e.g., +375)
              </p>
            </div>
            <Button 
              onClick={handleSendCode} 
              disabled={isLoading}
              data-testid="button-send-code"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Code
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
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
                Enter the 6-digit code sent to {phone}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => { setStep("phone"); setCode(""); }}
                data-testid="button-back"
              >
                Back
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={isLoading}
                data-testid="button-verify-code"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
            </div>
          </>
        )}
        <div id="recaptcha-container"></div>
      </CardContent>
    </Card>
  );
}
