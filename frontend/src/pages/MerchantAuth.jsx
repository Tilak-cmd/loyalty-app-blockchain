import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input, Label, Select } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { merchantApi } from "../services/endpoints";
import {
  Store, ArrowRight, Loader, CheckCircle, AlertCircle,
  Mail, Building, Globe, Phone, Image, Sparkles,
} from "lucide-react";
import Logo from "../components/Logo";

export default function MerchantAuth() {
  const { login: appLogin } = useAuth();
  const { login: privyLogin, logout: privyLogout, ready, authenticated, user: privyUser, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    businessName: "", legalBusinessName: "", phone: "", country: "", currency: "",
    website: "", logo: null,
    registrationNo: "", vat: "", pan: "",
  });

  const handleRegister = async () => {
    if (!form.businessName.trim()) { setError("Business name is required"); return; }
    if (!form.registrationNo.trim() && !form.vat.trim() && !form.pan.trim()) {
      setError("At least one of Company Registration Number, VAT, or PAN is required");
      return;
    }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== "") fd.append(k, v); });
      await privyLogin();
      setStep("wallet");
    } catch (e) {
      setError(e.message || "Registration failed");
      setLoading(false);
    }
  };

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
      try {
        const email = privyUser.email.address;
        const privyToken = await getAccessToken();
        if (!privyToken) { setError("Failed to get auth token. Try again."); setStep("form"); setLoading(false); return; }
        let res;
        if (mode === "register") {
          const fd = new FormData();
          Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== "") fd.append(k, v); });
          fd.append("email", email);
          fd.append("token", privyToken);
          res = await merchantApi.register(fd);
          setSuccess("Registration submitted! Awaiting approval.");
        } else {
          res = await merchantApi.login({ email, token: privyToken });
        }
        appLogin(res.data.token, "merchant", res.data.merchant);
        setStep("success");
        setTimeout(() => navigate("/merchant/dashboard"), 1000);
      } catch (e) {
        const msg = e.response?.data?.error || e.message || "Authentication failed";
        setError(msg);
        setStep("form");
        await privyLogout();
      }
      setLoading(false);
    }, 500);
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
        <Card className="max-w-md w-full text-center animate-scale-in">
          <CardContent className="pt-8 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {mode === "register" ? "Registration Submitted!" : "Welcome Back!"}
            </h2>
            <p className="text-sm text-text-tertiary mb-6">
              {mode === "register"
                ? "Your merchant application is under review. You'll be notified once approved."
                : "Redirecting to your dashboard..."}
            </p>
            <Loader className="w-5 h-5 animate-spin mx-auto text-brand-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const countryOptions = [
    { value: "Nepal", label: "Nepal" },
    { value: "India", label: "India" },
    { value: "United States", label: "United States" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "Australia", label: "Australia" },
  ];

  const currencyOptions = [
    { value: "NPR", label: "NPR - Nepalese Rupee" },
    { value: "INR", label: "INR - Indian Rupee" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "AUD", label: "AUD - Australian Dollar" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <Logo size="sm" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">
            {mode === "register" ? "Become a Merchant" : "Merchant Sign In"}
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            {mode === "register"
              ? "Create your loyalty program in minutes"
              : "Sign in to manage your loyalty program"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-tertiary rounded-xl p-1">
          <button
            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === "register" ? "bg-surface text-text-primary shadow-soft" : "text-text-tertiary"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === "login" ? "bg-surface text-text-primary shadow-soft" : "text-text-tertiary"
            }`}
          >
            Sign In
          </button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" /> {success}
              </div>
            )}

            {mode === "register" && (
              <>
                <div>
                  <Label required>Business Name</Label>
                  <Input
                    placeholder="e.g. Chia Pasal"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    icon={Building}
                  />
                </div>
                <div>
                  <Label>Legal Business Name</Label>
                  <Input
                    placeholder="Optional"
                    value={form.legalBusinessName}
                    onChange={(e) => setForm({ ...form, legalBusinessName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Company Registration Number</Label>
                  <Input
                    placeholder="e.g. REG-001"
                    value={form.registrationNo}
                    onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>VAT Number</Label>
                    <Input
                      placeholder="e.g. 123456789"
                      value={form.vat}
                      onChange={(e) => setForm({ ...form, vat: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>PAN Number</Label>
                    <Input
                      placeholder="e.g. 123456789"
                      value={form.pan}
                      onChange={(e) => setForm({ ...form, pan: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-text-tertiary -mt-2">At least one of Company Registration No., VAT, or PAN is required</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Country</Label>
                    <Select
                      options={countryOptions}
                      placeholder="Select..."
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select
                      options={currencyOptions}
                      placeholder="Select..."
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    placeholder="+977 98XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    icon={Phone}
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    placeholder="https://example.com"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    icon={Globe}
                  />
                </div>
              </>
            )}

            <p className="text-xs text-text-tertiary text-center">
              {mode === "register"
                ? "After clicking Continue, you'll verify your email via magic link to complete registration."
                : "Click Sign In below to verify your email via magic link."}
            </p>

            <Button
              className="w-full"
              size="lg"
              onClick={mode === "register" ? handleRegister : handleLogin}
              loading={loading}
            >
              <Store className="w-4 h-4" />
              {mode === "register" ? "Continue Registration" : "Sign In with Email"}
            </Button>

            <div className="text-center">
              {mode === "register" ? (
                <p className="text-sm text-text-tertiary">
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setError(""); }} className="text-brand-600 hover:text-brand-700 font-medium">
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-sm text-text-tertiary">
                  New merchant?{" "}
                  <button onClick={() => { setMode("register"); setError(""); }} className="text-brand-600 hover:text-brand-700 font-medium">
                    Register here
                  </button>
                </p>
              )}
            </div>

            <div className="text-center pt-2 border-t border-border-primary">
              <Link to="/customer/auth" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
                Are you a customer? Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
