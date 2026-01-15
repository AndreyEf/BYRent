import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema, registerOrganizationSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Home, Loader2, User, Building2 } from "lucide-react";

const registerIndividualFormSchema = registerUserSchema.extend({
  agreeToPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Необходимо согласие с политикой обработки персональных данных" }),
  }),
});

const registerOrganizationFormSchema = registerOrganizationSchema.extend({
  agreeToPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Необходимо согласие с политикой обработки персональных данных" }),
  }),
});

type RegisterIndividualFormData = z.infer<typeof registerIndividualFormSchema>;
type RegisterOrganizationFormData = z.infer<typeof registerOrganizationFormSchema>;

export default function Register() {
  const { register, registerOrganization } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<"individual" | "organization">("individual");

  const individualForm = useForm<RegisterIndividualFormData>({
    resolver: zodResolver(registerIndividualFormSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      agreeToPrivacy: false as unknown as true,
    },
  });

  const organizationForm = useForm<RegisterOrganizationFormData>({
    resolver: zodResolver(registerOrganizationFormSchema),
    defaultValues: {
      email: "",
      password: "",
      organizationName: "",
      unp: "",
      phone: "",
      agreeToPrivacy: false as unknown as true,
    },
  });

  const onSubmitIndividual = async (data: RegisterIndividualFormData) => {
    setIsLoading(true);
    try {
      const { agreeToPrivacy, ...registerData } = data;
      await register(registerData);
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в BYRent",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Ошибка регистрации",
        description: error instanceof Error ? error.message : "Попробуйте снова",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitOrganization = async (data: RegisterOrganizationFormData) => {
    setIsLoading(true);
    try {
      const { agreeToPrivacy, ...registerData } = data;
      await registerOrganization(registerData);
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в BYRent",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Ошибка регистрации",
        description: error instanceof Error ? error.message : "Попробуйте снова",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">BYRent</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-register-title">Регистрация</CardTitle>
            <CardDescription>
              Создайте аккаунт для управления арендой
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={accountType} onValueChange={(v) => setAccountType(v as "individual" | "organization")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="individual" className="flex items-center gap-2" data-testid="tab-individual">
                  <User className="h-4 w-4" />
                  Физ. лицо
                </TabsTrigger>
                <TabsTrigger value="organization" className="flex items-center gap-2" data-testid="tab-organization">
                  <Building2 className="h-4 w-4" />
                  Юр. лицо
                </TabsTrigger>
              </TabsList>

              <TabsContent value="individual">
                <Form {...individualForm}>
                  <form onSubmit={individualForm.handleSubmit(onSubmitIndividual)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={individualForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Иван"
                                {...field}
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={individualForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Фамилия *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Иванов"
                                {...field}
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={individualForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="example@mail.com"
                              autoComplete="email"
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={individualForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+375 29 123-45-67"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={individualForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пароль *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Минимум 6 символов"
                              autoComplete="new-password"
                              {...field}
                              data-testid="input-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={individualForm.control}
                      name="agreeToPrivacy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-privacy"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Ознакомлен и согласен с{" "}
                              <Link 
                                href="/privacy-policy" 
                                className="text-primary hover:underline"
                                data-testid="link-privacy-register"
                              >
                                Политикой обработки персональных данных
                              </Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Зарегистрироваться
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="organization">
                <Form {...organizationForm}>
                  <form onSubmit={organizationForm.handleSubmit(onSubmitOrganization)} className="space-y-4">
                    <FormField
                      control={organizationForm.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Наименование организации *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ООО «Название»"
                              {...field}
                              data-testid="input-organization-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="unp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>УНП *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123456789"
                              maxLength={9}
                              {...field}
                              data-testid="input-unp"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="company@mail.com"
                              autoComplete="email"
                              {...field}
                              data-testid="input-org-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Контактный телефон *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+375 29 123-45-67"
                              {...field}
                              data-testid="input-org-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пароль *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Минимум 6 символов"
                              autoComplete="new-password"
                              {...field}
                              data-testid="input-org-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={organizationForm.control}
                      name="agreeToPrivacy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-org-privacy"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Ознакомлен и согласен с{" "}
                              <Link 
                                href="/privacy-policy" 
                                className="text-primary hover:underline"
                                data-testid="link-org-privacy-register"
                              >
                                Политикой обработки персональных данных
                              </Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      Для юридических лиц подтверждение номера телефона не требуется
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register-org">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Зарегистрировать организацию
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-primary hover:underline" data-testid="link-to-login">
                Войдите
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
