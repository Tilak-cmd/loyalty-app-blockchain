import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../services/endpoints";
import { Shield, LogIn, AlertCircle, ArrowLeft, Loader } from "lucide-react";

export default function AdminLogin() {
  const { login: appLogin, user } = useAuth();
  const { login: privyLogin, logout: privyLogout, authenticated, user: privyUser, getAccessToken, ready } = usePrivy();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  useEffect(() => {
    if (user?.isAdmin) navigate("/admin", { replace: true });
  }, [user]);

  useEffect(() => {
    if (!waitingForAuth) return;
    if (!authenticated || !privyUser || !ready) return;
    setWaitingForAuth(false);
    doLogin();
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
    setError("");
    setLoading(true);
    if (authenticated && privyUser && ready) {
      doLogin();
    } else {
      setWaitingForAuth(true);
      privyLogin();
    }
  };

  const doLogin = async () => {
    setError("");
    const privyEmail = privyUser?.email?.address;
    if (!privyEmail) { setError("Could not get email from authentication"); setLoading(false); return; }
    try {
      const token = await getAccessToken();
      const r = await adminApi.login({ token, email: privyEmail });
      appLogin(r.data.token, "admin", r.data.user);
      navigate("/admin");
    } catch (e) { setError(e.response?.data?.error || "Not authorized as admin"); privyLogout(); }
    setLoading(false);
  };

  if (waitingForAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <Card className="w-full max-w-sm mx-4">
          <CardContent className="py-8 text-center space-y-3">
            <Loader className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-gray-700 font-medium">Check your email for a verification code...</p>
            <p className="text-xs text-gray-400">A Privy popup should appear. Complete it to continue.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link to="/" className="text-purple-600 font-bold text-lg flex items-center justify-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" />Back</Link>
          <CardTitle className="flex items-center justify-center gap-2"><Shield className="w-5 h-5" />Admin Login</CardTitle>
          <CardDesc>Sign in with your admin email</CardDesc>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center text-sm text-purple-700">
            <p>Click below to sign in with your admin email via Privy.</p>
            <p className="text-xs mt-1">A one-time code will be sent to your email.</p>
          </div>
          <Button className="w-full" onClick={startAuth} disabled={loading}>
            {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
            {loading ? "Opening Privy..." : "Sign in with Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
