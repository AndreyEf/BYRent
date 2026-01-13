import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star } from "lucide-react";
import { z } from "zod";

const reviewFormSchema = z.object({
  revieweeId: z.string(),
  propertyId: z.string().optional(),
  reviewType: z.enum(["landlord", "tenant"]),
  rating: z.number().min(1, "Выберите оценку").max(5),
  comment: z.string().max(2000, "Максимум 2000 символов").optional().nullable(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revieweeId: string;
  revieweeName: string;
  propertyId?: string;
  reviewType: "landlord" | "tenant";
}

export function ReviewForm({
  open,
  onOpenChange,
  revieweeId,
  revieweeName,
  propertyId,
  reviewType,
}: ReviewFormProps) {
  const { toast } = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    mode: "onChange",
    defaultValues: {
      revieweeId,
      propertyId: propertyId || undefined,
      reviewType,
      rating: undefined as unknown as number,
      comment: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      return res.json();
    },
    onSuccess: () => {
      onOpenChange(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({
        title: "Отзыв отправлен",
        description: "Ваш отзыв успешно сохранён",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ReviewFormData) => {
    submitMutation.mutate(data);
  };

  const rating = form.watch("rating");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Отзыв о {reviewType === "landlord" ? "арендодателе" : "арендаторе"}
          </DialogTitle>
          <DialogDescription>
            Оставьте отзыв о {revieweeName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Оценка</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      <input type="hidden" {...field} value={field.value ?? ""} />
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-1 hover:scale-110 transition-transform"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => {
                            field.onChange(star);
                          }}
                          data-testid={`button-star-${star}`}
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoveredRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Поделитесь своим опытом..."
                      className="min-h-[100px] resize-none"
                      data-testid="input-review-comment"
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
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                }}
                data-testid="button-cancel-review"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitMutation.isPending || !rating}
                data-testid="button-submit-review"
              >
                {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Отправить
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
