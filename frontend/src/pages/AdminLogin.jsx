import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { adminApi } from "../services/endpoints";
import { Shield, Loader, CheckCircle, AlertCircle } from "lucide-react";
import Logo from "../components/Logo";

export default function AdminLogin() {
  const { login: appLogin } = useAuth();
  const { login: privyLogin, logout: privyLogout, ready, authenticated, user: privyUser, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState("form");

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      await privyLogin();
      setStep("wallet");
    } catch (e) {
      setError(e.message || "Login failed");
      setLoading(false);
    }
  };

  if (step === "wallet" && ready && authenticated && privyUser?.email?.address) {
    setTimeout(async () => {
      const privyToken = await getAccessToken();
      if (!privyToken) { setError("Failed to get auth token from Privy. Try again."); setStep("form"); setLoading(false); await privyLogout(); return; }
      try {
        const res = await adminApi.login({ email: privyUser.email.address, token: privyToken });
        appLogin(res.data.token, "user", res.data.user);
        setSuccess(true);
        setTimeout(() => navigate("/admin"), 1000);
      } catch (e) {
        const msg = e.response?.data?.error || e.message || "Admin access denied";
        setError(msg);
        setStep("form");
        await privyLogout();
      }
      setLoading(false);
    }, 500);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
        <Card className="max-w-md w-full text-center animate-scale-in">
          <CardContent className="pt-8 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Welcome, Admin</h2>
            <Loader className="w-5 h-5 animate-spin mx-auto text-brand-600 mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <Logo size="sm" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-brand-700" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Access</h1>
          <p className="text-sm text-text-tertiary mt-1">Sign in with your admin email</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <p className="text-xs text-text-tertiary text-center">
              You'll be asked to verify your email via magic link. Only admin accounts can access this panel.
            </p>

            <Button className="w-full" size="lg" onClick={handleLogin} loading={loading}>
              <Shield className="w-4 h-4" /> Sign In as Admin
            </Button>

            <div className="text-center pt-2 border-t border-border-primary">
              <Link to="/" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
                Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
