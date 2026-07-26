import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { customerApi } from "../services/endpoints";
import { User, Save, Loader, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { OnChainBadge, BlockchainInfo } from "../components/BlockchainBadge";

export default function CustomerProfile() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [onChainBalance, setOnChainBalance] = useState(null);
  const [onChainMatch, setOnChainMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!customer) return;
    customerApi.profile().then(r => {
      const c = r.data.customer;
      setProfile(c);
      setOnChainBalance(r.data.onChainBalance ?? null);
      setOnChainMatch(r.data.onChainMatch ?? null);
      setForm({
        firstName: c.firstName || "",
        lastName: c.lastName || "",
        username: c.username || "",
        phone: c.phone || "",
        dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split("T")[0] : "",
        gender: c.gender || "",
        country: c.country || "",
        state: c.state || "",
        city: c.city || "",
        language: c.language || "",
        marketingConsent: c.marketingConsent || false,
      });
    }).catch(() => navigate("/customer/auth")).finally(() => setLoading(false));
  }, [customer]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const r = await customerApi.updateProfile(form);
      setProfile(r.data.customer);
      setSuccess("Profile updated!");
    } catch (e) { setError(e.response?.data?.error || "Update failed"); }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20"><Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <User className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name</Label><Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} /></div>
            <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} /></div>
          </div>
          <div><Label>Username</Label><Input value={form.username} onChange={(e) => update("username", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} /></div>
            <div><Label>Gender</Label><select className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.gender} onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Country</Label><Input value={form.country} onChange={(e) => update("country", e.target.value)} /></div>
            <div><Label>State</Label><Input value={form.state} onChange={(e) => update("state", e.target.value)} /></div>
            <div><Label>City</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
          </div>
          <div><Label>Language</Label><Input value={form.language} onChange={(e) => update("language", e.target.value)} placeholder="en" /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.marketingConsent} onChange={(e) => update("marketingConsent", e.target.checked)} />
            I agree to receive marketing communications
          </label>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {onChainBalance !== undefined && (
        <Card>
          <CardHeader className="flex items-center gap-2"><Shield className="w-4 h-4" /><CardTitle>Blockchain Verification</CardTitle></CardHeader>
          <CardContent>
            <BlockchainInfo
              onChainBalance={onChainBalance}
              onChainMatch={onChainMatch}
              walletAddress={profile?.walletAddress}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
