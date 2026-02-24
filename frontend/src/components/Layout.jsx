import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
  Menu,
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "ADMIN":
        return "default";
      case "OPD":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-slide-in-down">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-lamongan.png"
              alt="Logo Lamongan"
              className="w-10 h-10 object-contain transition-all duration-300 hover-scale drop-shadow"
            />
            <div className="hidden sm:block">
              <h1 className="text-base font-bold leading-tight sm:text-lg">
                E-Pembangunan Lamongan
              </h1>
              <p className="text-xs text-muted-foreground">
                Realisasi Pembangunan fisik Kabupaten Lamongan
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="items-center hidden gap-3 md:flex">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name}</p>
                <Badge
                  variant={getRoleBadgeVariant(user?.role)}
                  className="text-xs"
                >
                  {user?.role}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover-scale"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 animate-scale-in"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="transition-colors text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Modern Navigation */}
        <nav className="border-t bg-muted/40">
          <div className="container px-4 mx-auto">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
              <Link to="/">
                <Button
                  variant={
                    isActive("/") && location.pathname === "/"
                      ? "default"
                      : "ghost"
                  }
                  className="gap-2 transition-all duration-200 hover-lift"
                  size="sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>

              <Link to="/paket">
                <Button
                  variant={isActive("/paket") ? "default" : "ghost"}
                  className="gap-2 transition-all duration-200 hover-lift"
                  size="sm"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Paket Pekerjaan</span>
                </Button>
              </Link>

              <Link to="/opd">
                <Button
                  variant={isActive("/opd") ? "default" : "ghost"}
                  className="gap-2 transition-all duration-200 hover-lift"
                  size="sm"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">OPD</span>
                </Button>
              </Link>

              {user?.role === "ADMIN" && (
                <Link to="/users">
                  <Button
                    variant={isActive("/users") ? "default" : "ghost"}
                    className="gap-2 transition-all duration-200 hover-lift"
                    size="sm"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Pengguna</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-4 mx-auto sm:py-6 animate-fade-in">
        <Outlet />
      </main>

      {/* Modern Footer */}
      <footer className="mt-12 border-t bg-muted/40">
        <div className="container px-4 py-6 mx-auto">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-center sm:text-sm text-muted-foreground sm:text-left">
              © 2026 Pemerintah Kabupaten Lamongan. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Versi 1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
