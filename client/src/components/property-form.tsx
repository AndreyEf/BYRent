import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty, type Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertProperty) => void;
  isSubmitting?: boolean;
  initialData?: Property | null;
  mode?: "create" | "edit";
}

export function PropertyForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
  mode = "create",
}: PropertyFormProps) {
  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      address: "",
      ownerFullName: "",
      cadastralNumber: "",
      description: "",
      rentPrice: null,
      utilityPayments: null,
      hoaFees: null,
      electricityCost: null,
      additionalInfo: "",
    },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        address: initialData.address || "",
        ownerFullName: initialData.ownerFullName || "",
        cadastralNumber: initialData.cadastralNumber || "",
        description: initialData.description || "",
        rentPrice: initialData.rentPrice ?? null,
        utilityPayments: initialData.utilityPayments || null,
        hoaFees: initialData.hoaFees || null,
        electricityCost: initialData.electricityCost || null,
        additionalInfo: initialData.additionalInfo || "",
      });
    } else if (!open) {
      form.reset({
        address: "",
        ownerFullName: "",
        cadastralNumber: "",
        description: "",
        rentPrice: null,
        utilityPayments: null,
        hoaFees: null,
        electricityCost: null,
        additionalInfo: "",
      });
    }
  }, [initialData, open, form]);

  const handleSubmit = (data: InsertProperty) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">
            {mode === "create" ? "Добавить недвижимость" : "Редактировать недвижимость"}
          </DialogTitle>
          <DialogDescription>
            Заполните информацию об объекте недвижимости
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Адрес *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ул. Примерная, д. 1, кв. 1" 
                      {...field}
                      data-testid="input-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerFullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ФИО собственника *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Иванов Иван Иванович" 
                      {...field}
                      data-testid="input-owner-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cadastralNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Кадастровый номер *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="00:00:0000000:0000" 
                      {...field}
                      data-testid="input-cadastral"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Дополнительная информация о недвижимости..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Стоимость аренды</h3>
              
              <FormField
                control={form.control}
                name="rentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Арендная плата (руб./мес.)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="50000" 
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        data-testid="input-rent-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Информация для платежей</h3>
              
              <FormField
                control={form.control}
                name="utilityPayments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Коммунальные платежи</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Лицевой номер" 
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-utility"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hoaFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ТСЖ</FormLabel>
                    <FormDescription>Необязательное поле</FormDescription>
                    <FormControl>
                      <Input 
                        placeholder="Лицевой номер" 
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-hoa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="electricityCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Электроэнергия</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Лицевой номер" 
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        data-testid="input-electricity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дополнительная информация</FormLabel>
                    <FormDescription>Максимум 4096 символов</FormDescription>
                    <FormControl>
                      <Textarea 
                        placeholder="Реквизиты для оплаты, условия, контакты управляющей компании..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                        data-testid="input-additional-info"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-submit-property"
              >
                {isSubmitting ? "Сохранение..." : mode === "create" ? "Добавить" : "Сохранить"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
