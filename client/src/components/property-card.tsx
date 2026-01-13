import { Building2, MapPin, FileText, User, Banknote, Zap, Home, X } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PropertyWithOwner, RentalRequest } from "@shared/schema";

interface PropertyCardProps {
  property: PropertyWithOwner;
  variant?: "browse" | "owned" | "rented" | "tenant";
  rentalRequest?: RentalRequest;
  onRequestRental?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCancelRequest?: () => void;
  onManageTenant?: () => void;
  isRequesting?: boolean;
  isCancelling?: boolean;
}

export function PropertyCard({
  property,
  variant = "browse",
  rentalRequest,
  onRequestRental,
  onEdit,
  onDelete,
  onCancelRequest,
  onManageTenant,
  isRequesting,
  isCancelling,
}: PropertyCardProps) {
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

  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined) return null;
    return new Intl.NumberFormat("ru-RU").format(value);
  };

  const showPaymentInfo = variant === "owned" || variant === "tenant" || (variant === "rented" && rentalRequest?.status === "approved");

  return (
    <Card className="overflow-hidden hover-elevate transition-all" data-testid={`card-property-${property.id}`}>
      <div className="aspect-video relative bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="h-16 w-16 text-muted-foreground/40" />
        </div>
        {rentalRequest && (
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2" data-testid={`text-address-${property.id}`}>
            {property.address}
          </h3>
        </div>
        {property.rentPrice && (
          <p className="text-xl font-bold text-primary" data-testid={`text-rent-price-${property.id}`}>
            {formatPrice(property.rentPrice)} ₽/мес
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3 pb-4">
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
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="text-muted-foreground">
              ID владельца: <span className="font-mono text-foreground">{property.owner.visibleId}</span>
            </span>
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
      
      <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
        {variant === "browse" && !rentalRequest && (
          <Button 
            className="w-full" 
            onClick={onRequestRental}
            disabled={isRequesting}
            data-testid={`button-request-rental-${property.id}`}
          >
            {isRequesting ? "Отправка..." : "Запросить аренду"}
          </Button>
        )}
        
        {variant === "browse" && rentalRequest && (
          <div className="w-full text-center text-sm text-muted-foreground">
            Запрос отправлен
          </div>
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
        
        {variant === "owned" && (
          <div className="w-full space-y-2">
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
    </Card>
  );
}
