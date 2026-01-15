import { Link, useLocation } from "wouter";
import { Home, LogOut, User, Menu, X, Shield, Map, BarChart3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden font-semibold sm:inline-block" data-testid="text-logo">
            BYRent
          </span>
        </Link>

        {user && (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/dashboard">
                <Button variant="ghost" data-testid="link-dashboard">
                  Личный кабинет
                </Button>
              </Link>
              <Link href="/browse">
                <Button variant="ghost" data-testid="link-browse">
                  Поиск недвижимости
                </Button>
              </Link>
              <Link href="/map">
                <Button variant="ghost" data-testid="link-map">
                  <Map className="h-4 w-4 mr-2" />
                  Карта
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" data-testid="link-analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Аналитика
                </Button>
              </Link>
              <Link href="/reviews">
                <Button variant="ghost" data-testid="link-reviews">
                  <Star className="h-4 w-4 mr-2" />
                  Отзывы
                </Button>
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="link-profile">
                      <User className="h-4 w-4" />
                      Профиль
                    </Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="link-admin">
                        <Shield className="h-4 w-4" />
                        Админ-панель
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer" data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </>
        )}

        {!user && (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">
                Войти
              </Button>
            </Link>
            <Link href="/register">
              <Button data-testid="link-register">
                Регистрация
              </Button>
            </Link>
          </div>
        )}
      </div>

      {mobileMenuOpen && user && (
        <div className="border-t md:hidden">
          <nav className="container flex flex-col gap-1 p-4">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-dashboard-mobile">
                Личный кабинет
              </Button>
            </Link>
            <Link href="/browse" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-browse-mobile">
                Поиск недвижимости
              </Button>
            </Link>
            <Link href="/map" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-map-mobile">
                <Map className="h-4 w-4 mr-2" />
                Карта
              </Button>
            </Link>
            <Link href="/analytics" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-analytics-mobile">
                <BarChart3 className="h-4 w-4 mr-2" />
                Аналитика
              </Button>
            </Link>
            <Link href="/reviews" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start" data-testid="link-reviews-mobile">
                <Star className="h-4 w-4 mr-2" />
                Отзывы
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
