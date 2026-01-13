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
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      address: initialData?.address || "",
      ownerFullName: initialData?.ownerFullName || "",
      cadastralNumber: initialData?.cadastralNumber || "",
      description: initialData?.description || "",
    },
  });

  const handleSubmit = (data: InsertProperty) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">
            {mode === "create" ? "Добавить недвижимость" : "Редактировать недвижимость"}
          </DialogTitle>
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
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
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
