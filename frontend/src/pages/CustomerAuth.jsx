import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input, Label, Select } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { customerApi } from "../services/endpoints";
import {
  User, ArrowRight, Loader, CheckCircle, AlertCircle, Sparkles,
  AtSign, Phone, Calendar, Globe,
} from "lucide-react";
import Logo from "../components/Logo";

export default function CustomerAuth() {
  const { login: appLogin } = useAuth();
  const { login: privyLogin, logout: privyLogout, ready, authenticated, user: privyUser, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    firstName: "", lastName: "", username: "", phone: "", country: "",
    dateOfBirth: "", gender: "",
  });

  const handleRegister = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("First and last name required"); return; }
    setLoading(true); setError("");
    try {
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
          res = await customerApi.register({ ...form, email, token: privyToken });
          setSuccess("Account created!");
        } else {
          res = await customerApi.login({ email, token: privyToken });
        }
        appLogin(res.data.token, "customer", res.data.customer);
        setStep("success");
        setTimeout(() => navigate("/customer/dashboard"), 1000);
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
              Welcome to Namchepoints!
            </h2>
            <p className="text-sm text-text-tertiary mb-6">Redirecting to your dashboard...</p>
            <Loader className="w-5 h-5 animate-spin mx-auto text-brand-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const genderOptions = [
    { value: "", label: "Prefer not to say" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  const countryOptions = [
    { value: "Nepal", label: "Nepal" },
    { value: "India", label: "India" },
    { value: "United States", label: "United States" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "Australia", label: "Australia" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <Logo size="sm" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">
            {mode === "register" ? "Create Your Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            {mode === "register"
              ? "Start earning rewards at your favorite merchants"
              : "Sign in to manage your rewards"}
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

            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>First Name</Label>
                    <Input
                      placeholder="John"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label required>Last Name</Label>
                    <Input
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Username</Label>
                  <Input
                    placeholder="johndoe"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    icon={AtSign}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    icon={Phone}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select
                      options={genderOptions}
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Country</Label>
                  <Select
                    options={countryOptions}
                    placeholder="Select..."
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
              </>
            )}

            <p className="text-xs text-text-tertiary text-center">
              {mode === "register"
                ? "After clicking Continue, you'll verify your email via magic link."
                : "Click Sign In to verify your email via magic link."}
            </p>

            <Button
              className="w-full"
              size="lg"
              onClick={mode === "register" ? handleRegister : handleLogin}
              loading={loading}
            >
              <User className="w-4 h-4" />
              {mode === "register" ? "Create Account" : "Sign In with Email"}
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
                  New customer?{" "}
                  <button onClick={() => { setMode("register"); setError(""); }} className="text-brand-600 hover:text-brand-700 font-medium">
                    Create account
                  </button>
                </p>
              )}
            </div>

            <div className="text-center pt-2 border-t border-border-primary">
              <Link to="/merchant/login" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
                Are you a merchant? Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
