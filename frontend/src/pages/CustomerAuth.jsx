import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { customerApi } from "../services/endpoints";
import { User, CheckCircle, AlertCircle, LogIn, Loader, ArrowLeft } from "lucide-react";

export default function CustomerAuth() {
  const { login: appLogin, customer } = useAuth();
  const { login: privyLogin, logout: privyLogout, authenticated, user: privyUser, getAccessToken, ready } = usePrivy();
  const navigate = useNavigate();

  const [mode, setMode] = useState("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  useEffect(() => {
    if (customer) navigate("/customer/dashboard", { replace: true });
  }, [customer]);

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
    if (mode === "register" && (!firstName.trim() || !lastName.trim())) {
      setError("First and last name are required");
      return;
    }
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
      const r = await customerApi.register({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: privyEmail,
        username: username.trim() || undefined,
        phone: phone.trim() || undefined,
        country: country.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
      });
      appLogin(r.data.token, "customer", r.data.customer);
      setSuccess("Account created! Welcome to LoyalChain.");
      setTimeout(() => navigate("/customer/dashboard"), 1000);
    } catch (e) { setError(e.response?.data?.error || "Registration failed"); privyLogout(); }
    setLoading(false);
  };

  const doLogin = async () => {
    setError("");
    const privyEmail = privyUser?.email?.address;
    if (!privyEmail) { setError("Could not get email from authentication"); setLoading(false); return; }
    try {
      const token = await getAccessToken();
      const r = await customerApi.login({ token, email: privyEmail });
      appLogin(r.data.token, "customer", r.data.customer);
      navigate("/customer/dashboard");
    } catch (e) { setError(e.response?.data?.error || "Login failed. Please register first."); privyLogout(); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-green-800">Welcome!</h2>
            <p className="text-sm text-gray-500">{success}</p>
            <Button onClick={() => navigate("/customer/dashboard")}>Go to Dashboard</Button>
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

  const regForm = (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <Link to="/" className="text-blue-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" />Back</Link>
        <CardTitle className="flex items-center justify-center gap-2"><User className="w-5 h-5" />Create Your Account</CardTitle>
        <CardDesc>Join LoyalChain to earn and manage rewards</CardDesc>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><Label>First Name *</Label><Input placeholder="First" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
          <div><Label>Last Name *</Label><Input placeholder="Last" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
        </div>
        <div><Label>Username</Label><Input placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div><Label>Phone</Label><Input placeholder="+977 98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Date of Birth</Label><Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
          <div><Label>Gender</Label><select className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select></div>
        </div>
        <div><Label>Country</Label><Input placeholder="Nepal" value={country} onChange={(e) => setCountry(e.target.value)} /></div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          After clicking Continue, you'll verify your email via Privy in a popup window.
        </div>
        <Button className="w-full" onClick={startAuth} disabled={!firstName.trim() || !lastName.trim() || loading}>
          {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
          {loading ? "Opening Privy..." : "Continue"}
        </Button>
        {(!firstName.trim() || !lastName.trim()) && (
          <p className="text-xs text-center text-amber-600">Fill in first and last name to continue</p>
        )}
        <p className="text-xs text-center text-gray-400">Already have an account? <button onClick={() => { setMode("login"); setError(""); }} className="text-blue-600 hover:underline">Sign in</button></p>
      </CardContent>
    </Card>
  );

  const loginForm = (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <Link to="/" className="text-blue-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" />Back</Link>
        <CardTitle>Welcome Back</CardTitle>
        <CardDesc>Sign in to your LoyalChain account</CardDesc>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-sm text-blue-700">
          <p>Click below to sign in with your email via Privy.</p>
          <p className="text-xs mt-1">A one-time code will be sent to your email.</p>
        </div>
        <Button className="w-full" onClick={startAuth} disabled={loading}>
          {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
          {loading ? "Opening Privy..." : "Sign in with Email"}
        </Button>
        <p className="text-xs text-center text-gray-400">Don't have an account? <button onClick={() => { setMode("register"); setError(""); }} className="text-blue-600 hover:underline">Create one</button></p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-8">
      {mode === "register" ? regForm : loginForm}
    </div>
  );
}
