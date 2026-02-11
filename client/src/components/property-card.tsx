import { Building2, MapPin, FileText, User, Banknote, Zap, Home, X, RefreshCw, History, Download, Eye, EyeOff, Power, LogOut, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useState, useCallback, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { PropertyWithOwner, RentalRequest } from "@shared/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useExchangeRate, formatRentPrice } from "@/hooks/use-exchange-rate";

function OwnerRating({ ownerId }: { ownerId: string }) {
  const { data: ratingData } = useQuery<{ rating: number }>({
    queryKey: ["/api/reviews/rating", ownerId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/rating/${ownerId}`);
      if (!res.ok) return { rating: 0 };
      return res.json();
    },
    staleTime: 60000,
  });

  if (!ratingData || ratingData.rating === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span>{ratingData.rating.toFixed(1)}</span>
    </div>
  );
}

interface PropertyCardProps {
  property: PropertyWithOwner;
  variant?: "browse" | "owned" | "rented" | "tenant";
  rentalRequest?: RentalRequest;
  allRequestsForProperty?: RentalRequest[];
  onRequestRental?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCancelRequest?: () => void;
  onManageTenant?: () => void;
  onToggleVisibility?: (isVisible: boolean) => void;
  onToggleActive?: (isActive: boolean) => void;
  onLeaveRental?: () => void;
  onReviewOwner?: () => void;
  isRequesting?: boolean;
  isCancelling?: boolean;
  isTogglingVisibility?: boolean;
  isTogglingActive?: boolean;
  isLeavingRental?: boolean;
}

export function PropertyCard({
  property,
  variant = "browse",
  rentalRequest,
  allRequestsForProperty,
  onRequestRental,
  onEdit,
  onDelete,
  onCancelRequest,
  onManageTenant,
  onToggleVisibility,
  onToggleActive,
  onLeaveRental,
  onReviewOwner,
  isRequesting,
  isCancelling,
  isTogglingVisibility,
  isTogglingActive,
  isLeavingRental,
}: PropertyCardProps) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onCarouselSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
    setCanScrollPrev(carouselApi.canScrollPrev());
    setCanScrollNext(carouselApi.canScrollNext());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    onCarouselSelect();
    carouselApi.on("select", onCarouselSelect);
    carouselApi.on("reInit", onCarouselSelect);
    return () => {
      carouselApi.off("select", onCarouselSelect);
      carouselApi.off("reInit", onCarouselSelect);
    };
  }, [carouselApi, onCarouselSelect]);

  const handleActiveToggle = (checked: boolean) => {
    if (!checked && property.currentTenantId) {
      setShowDeactivateDialog(true);
    } else {
      onToggleActive?.(checked);
    }
  };

  const getStatusBadge = () => {
    if (!rentalRequest) return null;
    
    switch (rentalRequest.status) {
      case "pending":
        return <Badge variant="secondary" data-testid={`badge-status-${property.id}`}>Ожидает подтверждения</Badge>;
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-700 text-white" data-testid={`badge-status-${property.id}`}>Одобрено</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid={`badge-status-${property.id}`}>Отклонено</Badge>;
      case "cancelled":
        return <Badge variant="outline" data-testid={`badge-status-${property.id}`}>Отменено</Badge>;
      default:
        return null;
    }
  };

  const usdRate = useExchangeRate();

  const showPaymentInfo = variant === "owned" || variant === "tenant" || (variant === "rented" && rentalRequest?.status === "approved");

  return (
    <Card className="overflow-hidden hover-elevate transition-all flex flex-col h-full" data-testid={`card-property-${property.id}`}>
      <div className="aspect-video relative bg-muted">
        {property.photos && property.photos.length > 1 ? (
          <Carousel setApi={setCarouselApi} className="w-full h-full" opts={{ loop: true }}>
            <CarouselContent className="h-full ml-0">
              {property.photos.map((photo, index) => (
                <CarouselItem key={index} className="h-full pl-0">
                  <img 
                    src={photo} 
                    alt={`${property.fullAddress || property.city} - фото ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {canScrollPrev && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  carouselApi?.scrollPrev();
                }}
                data-testid={`button-prev-photo-${property.id}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {canScrollNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  carouselApi?.scrollNext();
                }}
                data-testid={`button-next-photo-${property.id}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {property.photos.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentSlide ? "bg-white" : "bg-white/50"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    carouselApi?.scrollTo(index);
                  }}
                  data-testid={`button-dot-${property.id}-${index}`}
                />
              ))}
            </div>
          </Carousel>
        ) : property.photos && property.photos.length === 1 ? (
          <img 
            src={property.photos[0]} 
            alt={property.fullAddress || `${property.city}, ${property.street}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
        {rentalRequest && (
          <div className="absolute top-3 right-3 z-10">
            {getStatusBadge()}
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2" data-testid={`text-address-${property.id}`}>
            {property.fullAddress || `${property.city}, ${property.street}, д. ${property.building}${property.block ? `, корп. ${property.block}` : ''}, кв. ${property.apartment}`}
          </h3>
        </div>
        {property.rentPrice && (
          <p className="text-xl font-bold text-primary" data-testid={`text-rent-price-${property.id}`}>
            {formatRentPrice(property.rentPrice, usdRate)}/мес
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3 pb-4 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate" data-testid={`text-owner-${property.id}`}>
            {property.ownerFullName}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="font-mono text-xs truncate" data-testid={`text-cadastral-${property.id}`}>
            {property.cadastralNumber}
          </span>
        </div>
        
        {property.description && (
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${property.id}`}>
            {property.description}
          </p>
        )}

        {variant === "browse" && property.owner && (
          <div className="flex items-center justify-between gap-2 text-sm">
            <Link href={`/reviews?search=${property.owner.visibleId}`} className="flex items-center gap-2 hover:text-primary transition-colors">
              <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="text-muted-foreground">
                ID: <span className="font-mono text-foreground">{property.owner.visibleId}</span>
              </span>
            </Link>
            <OwnerRating ownerId={property.owner.id} />
          </div>
        )}

        {showPaymentInfo && (property.utilityPayments || property.hoaFees || property.electricityCost) && (
          <>
            <Separator className="my-2" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-muted-foreground">Лицевые номера для платежей:</p>
              {property.utilityPayments && (
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>Коммунальные: <span className="font-mono">{property.utilityPayments}</span></span>
                </div>
              )}
              {property.hoaFees && (
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span>ТСЖ: <span className="font-mono">{property.hoaFees}</span></span>
                </div>
              )}
              {property.electricityCost && (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>Электроэнергия: <span className="font-mono">{property.electricityCost}</span></span>
                </div>
              )}
            </div>
          </>
        )}

        {showPaymentInfo && property.additionalInfo && (
          <>
            <Separator className="my-2" />
            <div className="text-sm">
              <p className="font-medium text-muted-foreground mb-1">Дополнительно:</p>
              <p className="text-muted-foreground line-clamp-3">{property.additionalInfo}</p>
            </div>
          </>
        )}

        {property.contractFile && (
          <>
            <Separator className="my-2" />
            <div className="text-sm">
              <p className="font-medium text-muted-foreground mb-1">Договор и документы:</p>
              <a 
                href={property.contractFile} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
                data-testid={`link-contract-${property.id}`}
              >
                <Download className="h-4 w-4" />
                <span className="truncate">{decodeURIComponent(property.contractFile.split('/').pop() || 'Документ')}</span>
              </a>
            </div>
          </>
        )}

        {variant === "owned" && property.currentTenantId && (
          <>
            <Separator className="my-2" />
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Есть арендатор</span>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2 border-t pt-4 mt-auto">
        {variant === "browse" && (!rentalRequest || rentalRequest.status === "cancelled" || rentalRequest.status === "rejected") && (
          <Button 
            className="w-full" 
            onClick={onRequestRental}
            disabled={isRequesting}
            data-testid={`button-request-rental-${property.id}`}
          >
            {isRequesting ? "Отправка..." : (
              rentalRequest?.status === "cancelled" || rentalRequest?.status === "rejected" 
                ? <><RefreshCw className="h-4 w-4 mr-2" />Отправить повторно</>
                : "Запросить аренду"
            )}
          </Button>
        )}
        
        {variant === "browse" && rentalRequest && rentalRequest.status !== "cancelled" && rentalRequest.status !== "rejected" && (
          <div className="w-full text-center text-sm text-muted-foreground">
            Запрос отправлен
          </div>
        )}
        
        {variant === "browse" && allRequestsForProperty && allRequestsForProperty.length > 0 && (
          <Collapsible className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full" data-testid={`button-history-${property.id}`}>
                <History className="h-4 w-4 mr-2" />
                История запросов ({allRequestsForProperty.length})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2" data-testid={`collapsible-history-${property.id}`}>
              {allRequestsForProperty.map((req, index) => (
                <div key={req.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted" data-testid={`row-history-${property.id}-${index}`}>
                  <span data-testid={`text-history-date-${property.id}-${index}`}>
                    {req.createdAt ? format(new Date(req.createdAt), "d MMM yyyy", { locale: ru }) : "—"}
                  </span>
                  <Badge 
                    variant={
                      req.status === "approved" ? "default" :
                      req.status === "rejected" ? "destructive" :
                      req.status === "cancelled" ? "outline" : "secondary"
                    }
                    className={req.status === "approved" ? "bg-green-600" : ""}
                    data-testid={`badge-history-status-${property.id}-${index}`}
                  >
                    {req.status === "pending" ? "Ожидает" :
                     req.status === "approved" ? "Одобрено" :
                     req.status === "rejected" ? "Отклонено" : "Отменено"}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {variant === "rented" && rentalRequest?.status === "pending" && (
          <Button 
            variant="outline"
            className="w-full" 
            onClick={onCancelRequest}
            disabled={isCancelling}
            data-testid={`button-cancel-request-${property.id}`}
          >
            <X className="h-4 w-4 mr-2" />
            {isCancelling ? "Отмена..." : "Отменить заявку"}
          </Button>
        )}
        
        {variant === "tenant" && (
          <div className="w-full space-y-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onReviewOwner}
              data-testid={`button-review-owner-${property.id}`}
            >
              <Star className="h-4 w-4 mr-2" />
              Оставить отзыв
            </Button>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={onLeaveRental}
              disabled={isLeavingRental}
              data-testid={`button-leave-rental-${property.id}`}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLeavingRental ? "Отключение..." : "Отказаться от аренды"}
            </Button>
          </div>
        )}

        {variant === "owned" && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                {property.isVisible ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm">Видимость в поиске</span>
              </div>
              <Switch
                checked={property.isVisible !== false}
                onCheckedChange={(checked) => onToggleVisibility?.(checked)}
                disabled={isTogglingVisibility}
                data-testid={`switch-visibility-${property.id}`}
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <Power className={`h-4 w-4 ${property.isActive !== false ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className="text-sm">Активен</span>
              </div>
              <Switch
                checked={property.isActive !== false}
                onCheckedChange={handleActiveToggle}
                disabled={isTogglingActive}
                data-testid={`switch-active-${property.id}`}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onEdit} data-testid={`button-edit-${property.id}`}>
                Редактировать
              </Button>
              <Button variant="destructive" className="flex-1" onClick={onDelete} data-testid={`button-delete-${property.id}`}>
                Удалить
              </Button>
            </div>
            {onManageTenant && (
              <Button variant="secondary" className="w-full" onClick={onManageTenant} data-testid={`button-manage-tenant-${property.id}`}>
                <User className="h-4 w-4 mr-2" />
                {property.currentTenantId ? "Управление арендатором" : "Добавить арендатора"}
              </Button>
            )}
          </div>
        )}
      </CardFooter>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Деактивировать объект?</AlertDialogTitle>
            <AlertDialogDescription>
              У этого объекта есть арендатор. При деактивации связь с арендатором будет удалена.
              Вы уверены, что хотите продолжить?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onToggleActive?.(false);
                setShowDeactivateDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Деактивировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
