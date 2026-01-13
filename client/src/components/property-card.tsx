import { Building2, MapPin, FileText, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PropertyWithOwner, RentalRequest } from "@shared/schema";

interface PropertyCardProps {
  property: PropertyWithOwner;
  variant?: "browse" | "owned" | "rented";
  rentalRequest?: RentalRequest;
  onRequestRental?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isRequesting?: boolean;
}

export function PropertyCard({
  property,
  variant = "browse",
  rentalRequest,
  onRequestRental,
  onEdit,
  onDelete,
  isRequesting,
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
      default:
        return null;
    }
  };

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
        
        {variant === "owned" && (
          <>
            <Button variant="outline" className="flex-1" onClick={onEdit} data-testid={`button-edit-${property.id}`}>
              Редактировать
            </Button>
            <Button variant="destructive" className="flex-1" onClick={onDelete} data-testid={`button-delete-${property.id}`}>
              Удалить
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
