import { Building2, User, Phone, Mail, Clock, Check, X } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RentalRequestWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface RentalRequestCardProps {
  request: RentalRequestWithDetails;
  onApprove?: () => void;
  onReject?: () => void;
  isProcessing?: boolean;
}

export function RentalRequestCard({
  request,
  onApprove,
  onReject,
  isProcessing,
}: RentalRequestCardProps) {
  const getStatusBadge = () => {
    switch (request.status) {
      case "pending":
        return <Badge variant="secondary">Ожидает</Badge>;
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">Одобрено</Badge>;
      case "rejected":
        return <Badge variant="destructive">Отклонено</Badge>;
      default:
        return null;
    }
  };

  const timeAgo = request.createdAt
    ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ru })
    : "";

  return (
    <Card className="overflow-hidden" data-testid={`card-request-${request.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold" data-testid={`text-request-address-${request.id}`}>
              {request.property.address}
            </h3>
          </div>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {timeAgo}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium" data-testid={`text-requester-name-${request.id}`}>
              {request.requester.firstName} {request.requester.lastName}
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              ID: {request.requester.visibleId}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span data-testid={`text-requester-email-${request.id}`}>{request.requester.email}</span>
          </div>
          
          {request.requester.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span data-testid={`text-requester-phone-${request.id}`}>{request.requester.phone}</span>
            </div>
          )}
        </div>
      </CardContent>

      {request.status === "pending" && (
        <CardFooter className="flex gap-2 border-t pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReject}
            disabled={isProcessing}
            data-testid={`button-reject-${request.id}`}
          >
            <X className="h-4 w-4 mr-2" />
            Отклонить
          </Button>
          <Button
            className="flex-1"
            onClick={onApprove}
            disabled={isProcessing}
            data-testid={`button-approve-${request.id}`}
          >
            <Check className="h-4 w-4 mr-2" />
            Одобрить
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
