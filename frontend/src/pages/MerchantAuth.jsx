import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { merchantApi } from "../services/endpoints";
import { Store, Upload, CheckCircle, AlertCircle, LogIn, Building, Loader, Mail } from "lucide-react";

export default function MerchantAuth() {
  const { login: appLogin, merchant } = useAuth();
  const { login: privyLogin, logout: privyLogout, authenticated, user: privyUser, getAccessToken, ready } = usePrivy();
  const navigate = useNavigate();
  const logoRef = useRef(null);

  const [mode, setMode] = useState("register");
  const [businessName, setBusinessName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("NPR");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  useEffect(() => {
    if (merchant) navigate("/merchant/dashboard", { replace: true });
  }, [merchant]);

  useEffect(() => {
    if (!waitingForAuth) return;
    if (!authenticated || !privyUser || !ready) return;
    setWaitingForAuth(false);
    if (mode === "register") submitRegistration();
    else doLogin();
  }, [authenticated, privyUser, ready, waitingForAuth]);

  useEffect(() => {
    if (!waitingForAuth) return;
    const timer = setTimeout(() => {
      setWaitingForAuth(false);
      setLoading(false);
      setError("Authentication timed out. Please make sure you complete the email verification in the popup window.");
    }, 60000);
    return () => clearTimeout(timer);
  }, [waitingForAuth]);

  const startAuth = () => {
    if (mode === "register" && !businessName.trim()) { setError("Business name is required"); return; }
    setError("");
    setLoading(true);
    if (authenticated && privyUser && ready) {
      if (mode === "register") submitRegistration();
      else doLogin();
    } else {
      setWaitingForAuth(true);
      privyLogin();
    }
  };

  const submitRegistration = async () => {
    setError("");
    const privyEmail = privyUser?.email?.address;
    if (!privyEmail) { setError("Could not get email from authentication"); setLoading(false); return; }
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append("token", token);
      formData.append("businessName", businessName.trim());
      formData.append("email", privyEmail);
      if (legalName) formData.append("legalBusinessName", legalName.trim());
      if (phone) formData.append("phone", phone.trim());
      if (country) formData.append("country", country.trim());
      if (currency) formData.append("currency", currency.trim());
      if (website) formData.append("website", website.trim());
      if (logoFile) formData.append("logo", logoFile);
      const r = await merchantApi.register(formData);
      appLogin(r.data.token, "merchant", r.data.merchant);
      setSuccess("Registration submitted! Awaiting admin approval.");
      setTimeout(() => navigate("/merchant/dashboard"), 1500);
    } catch (e) {
      setError(e.response?.data?.error || "Registration failed");
      privyLogout();
    }
    setLoading(false);
  };

  const doLogin = async () => {
    setError("");
    const privyEmail = privyUser?.email?.address;
    if (!privyEmail) { setError("Could not get email from authentication"); setLoading(false); return; }
    try {
      const token = await getAccessToken();
      const r = await merchantApi.login({ token, email: privyEmail });
      appLogin(r.data.token, "merchant", r.data.merchant);
      navigate("/merchant/dashboard");
    } catch (e) { setError(e.response?.data?.error || "Login failed"); privyLogout(); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-green-800">Application Submitted!</h2>
            <p className="text-sm text-gray-500">{success}</p>
            <Button onClick={() => navigate("/merchant/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (waitingForAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Card className="w-full max-w-sm mx-4">
          <CardContent className="py-8 text-center space-y-3">
            <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-700 font-medium">Check your email for a verification code...</p>
            <p className="text-xs text-gray-400">A Privy popup should appear. Complete it to continue.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Link to="/" className="text-blue-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><Store className="w-4 h-4" />Back</Link>
            <CardTitle>Merchant Login</CardTitle>
            <CardDesc>Sign in to your merchant account</CardDesc>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-sm text-blue-700">
              <p>Click below to sign in with your business email via Privy.</p>
              <p className="text-xs mt-1">A one-time code will be sent to your email.</p>
            </div>
            <Button className="w-full" onClick={startAuth} disabled={loading}>
              {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
              {loading ? "Opening Privy..." : "Sign in with Email"}
            </Button>
            <p className="text-xs text-center text-gray-400">
              Don't have an account? <button onClick={() => { setMode("register"); setError(""); }} className="text-blue-600 hover:underline">Register here</button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link to="/" className="text-blue-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><Store className="w-4 h-4" />Back</Link>
          <CardTitle className="flex items-center justify-center gap-2"><Building className="w-5 h-5" />Register Your Business</CardTitle>
          <CardDesc>Create your merchant account to start a loyalty program</CardDesc>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

          <div>
            <Label>Business Name *</Label>
            <Input placeholder="Your business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div>
            <Label>Legal Business Name</Label>
            <Input placeholder="Legal name (if different)" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input placeholder="+977 98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Country</Label>
              <Input placeholder="Nepal" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Currency</Label>
              <Input placeholder="NPR" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div>
              <Label>Website</Label>
              <Input placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Business Logo</Label>
            <div onClick={() => logoRef.current?.click()} className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors">
              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
              <p className="text-sm text-gray-500">{logoFile ? logoFile.name : "Click to upload logo"}</p>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            After clicking Continue, you'll verify your business email via Privy in a popup window.
          </div>
          <Button className="w-full" onClick={startAuth} disabled={!businessName.trim() || loading}>
            {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
            {loading ? "Opening Privy..." : "Continue"}
          </Button>
          {!businessName.trim() && (
            <p className="text-xs text-center text-amber-600">Fill in business name to continue</p>
          )}
          <p className="text-xs text-center text-gray-400">
            Already registered? <button onClick={() => { setMode("login"); setError(""); }} className="text-blue-600 hover:underline">Sign in</button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
