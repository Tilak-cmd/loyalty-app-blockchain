import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label, Select } from "../components/ui/input";
import { LoadingState } from "../components/ui/empty-state";
import { useAuth } from "../contexts/AuthContext";
import { customerApi } from "../services/endpoints";

import {
  User, Save, Loader, AlertCircle, CheckCircle,
  Phone, AtSign,
} from "lucide-react";

export default function CustomerProfile() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!customer) return;
    customerApi.profile().then(r => {
      const c = r.data.customer;
      setProfile(c);
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

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); setSuccess(""); };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const r = await customerApi.updateProfile(form);
      setProfile(r.data.customer);
      setSuccess("Profile saved!");
      setDirty(false);
    } catch (e) { setError(e.response?.data?.error || "Update failed"); }
    setSaving(false);
  };

  if (!customer) return null;
  if (loading) return <LoadingState />;

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || customer.email;
  const genderOptions = [
    { value: "", label: "Prefer not to say" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
        <p className="text-sm text-text-tertiary mt-0.5">Manage your personal information and preferences</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-4 pb-2 border-b border-border-primary">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
              <User className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-lg text-text-primary">{fullName}</p>
              {profile?.email && <p className="text-sm text-text-tertiary">{profile.email}</p>}
              {profile?.username && <p className="text-xs text-text-tertiary">@{profile.username}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="John" />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Doe" />
            </div>
          </div>

          <div>
            <Label>Username</Label>
            <Input value={form.username} onChange={(e) => update("username", e.target.value)} icon={AtSign} placeholder="johndoe" />
          </div>

          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} icon={Phone} placeholder="+1 (555) 000-0000" />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <Label>Gender</Label>
              <Select options={genderOptions} value={form.gender} onChange={(e) => update("gender", e.target.value)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="Nepal" />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="Bagmati" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Kathmandu" />
            </div>
          </div>

          <div>
            <Label>Language</Label>
            <Input value={form.language} onChange={(e) => update("language", e.target.value)} placeholder="en" />
          </div>

          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(e) => update("marketingConsent", e.target.checked)}
              className="w-4 h-4 rounded border-border-primary text-brand-600 focus:ring-brand-500"
            />
            <span className="text-text-secondary">I agree to receive marketing communications</span>
          </label>

          <div className="flex items-center justify-between pt-2 border-t border-border-primary">
            <p className="text-xs text-text-tertiary">Changes are saved to your account</p>
            <Button onClick={handleSave} disabled={saving || !dirty} loading={saving}>
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
