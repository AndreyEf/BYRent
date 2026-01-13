import { Building2, Home, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: "property" | "rental" | "search" | "request";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "property",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Icon = {
    property: Building2,
    rental: Home,
    search: Search,
    request: FileText,
  }[icon];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="empty-state">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6" data-testid="text-empty-description">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} data-testid="button-empty-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
