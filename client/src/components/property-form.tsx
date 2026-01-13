import { useEffect, useState } from "react";
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
import { useUpload } from "@/hooks/use-upload";
import { Upload, X, Loader2, ImageIcon, FileText, Download } from "lucide-react";

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [contractFile, setContractFile] = useState<string | null>(null);
  const [isContractUploading, setIsContractUploading] = useState(false);
  const { uploadFile, isUploading } = useUpload();
  
  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      address: "",
      ownerFullName: "",
      cadastralNumber: "",
      description: "",
      photos: [],
      rentPrice: null,
      utilityPayments: null,
      hoaFees: null,
      electricityCost: null,
      additionalInfo: "",
      contractFile: null,
    },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        address: initialData.address || "",
        ownerFullName: initialData.ownerFullName || "",
        cadastralNumber: initialData.cadastralNumber || "",
        description: initialData.description || "",
        photos: initialData.photos || [],
        rentPrice: initialData.rentPrice ?? null,
        utilityPayments: initialData.utilityPayments || null,
        hoaFees: initialData.hoaFees || null,
        electricityCost: initialData.electricityCost || null,
        additionalInfo: initialData.additionalInfo || "",
        contractFile: initialData.contractFile || null,
      });
      setPhotos(initialData.photos || []);
      setContractFile(initialData.contractFile || null);
    } else if (!open) {
      form.reset({
        address: "",
        ownerFullName: "",
        cadastralNumber: "",
        description: "",
        photos: [],
        rentPrice: null,
        utilityPayments: null,
        hoaFees: null,
        electricityCost: null,
        additionalInfo: "",
        contractFile: null,
      });
      setPhotos([]);
      setContractFile(null);
    }
  }, [initialData, open, form]);

  const handleSubmit = (data: InsertProperty) => {
    onSubmit({ 
      ...data, 
      photos: photos.length > 0 ? photos : null,
      contractFile: contractFile || null
    });
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsContractUploading(true);
    const result = await uploadFile(file);
    if (result) {
      setContractFile(result.objectPath);
    }
    setIsContractUploading(false);
    e.target.value = "";
  };

  const removeContract = () => {
    setContractFile(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      
      const result = await uploadFile(file);
      if (result) {
        setPhotos(prev => [...prev, result.objectPath]);
      }
    }
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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
              <h3 className="text-sm font-medium">Фотографии</h3>
              
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-video rounded-md overflow-hidden border bg-muted">
                    <img 
                      src={photo} 
                      alt={`Фото ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background"
                      data-testid={`button-remove-photo-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                <label className="aspect-video rounded-md border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    data-testid="input-photo-upload"
                  />
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Добавить</span>
                    </>
                  )}
                </label>
              </div>
              <FormDescription>Максимум 10 фотографий. Форматы: JPG, PNG</FormDescription>
            </div>

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

            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Типовой договор</h3>
              <FormDescription>
                Загрузите образец договора аренды. Арендаторы смогут скачать его.
              </FormDescription>
              
              {contractFile ? (
                <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/50">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm truncate flex-1">Договор загружен</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeContract}
                    data-testid="button-remove-contract"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 rounded-md border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleContractUpload}
                    disabled={isContractUploading}
                    data-testid="input-contract-upload"
                  />
                  {isContractUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Загрузить договор (PDF, DOC)</span>
                    </>
                  )}
                </label>
              )}
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
