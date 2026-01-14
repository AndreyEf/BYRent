import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-privacy-title">
              Политика обработки персональных данных
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground" data-testid="text-privacy-placeholder">
              Содержимое политики обработки персональных данных будет добавлено позже.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
