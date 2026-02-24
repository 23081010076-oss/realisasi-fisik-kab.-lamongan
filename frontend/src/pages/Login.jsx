import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Mail, Shield } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authService.login(formData.email, formData.password);
      setAuth(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/lamongan.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/70 via-blue-900/60 to-cyan-900/70 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo Header */}
        <div className="space-y-2 text-center animate-slide-in-down">
          <div className="flex justify-center mb-4">
            <div className="p-4 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl hover-scale">
              <img
                src="/logo-lamongan.png"
                alt="Logo Lamongan"
                className="object-contain w-16 h-16"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl drop-shadow-md">
            E-Pembangunan Lamongan
          </h1>
          <p className="text-base font-medium text-blue-100 sm:text-lg drop-shadow">
            Sistem Realisasi Pembangunan Fisik Kabupaten Lamongan
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border-0 shadow-2xl animate-scale-in hover-lift">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center text-gray-900 sm:text-2xl">
              Masuk ke Sistem
            </CardTitle>
            <CardDescription className="text-sm text-center">
              Masukkan kredensial Anda untuk mengakses dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-start gap-2 p-3 mb-4 text-sm border rounded-lg bg-destructive/10 border-destructive/20 text-destructive animate-slide-in-down">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="masukkan email Anda"
                    className="pl-9 transition-all duration-200 focus:scale-[1.01]"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 transition-all duration-200 focus:scale-[1.01]"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs font-medium text-center text-blue-100 sm:text-sm animate-fade-in drop-shadow">
          © 2026 Kabupaten Lamongan. All rights reserved.
        </p>
      </div>
    </div>
  );
}
