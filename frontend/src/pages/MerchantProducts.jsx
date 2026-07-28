import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { merchantProductsApi } from "../services/endpoints";
import { Package, Plus, Edit2, Trash2, AlertCircle, CheckCircle, X, Loader, Image, DollarSign } from "lucide-react";

export default function MerchantProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", tokenPrice: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await merchantProductsApi.list();
      setProducts(r.data.products);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", imageUrl: "", tokenPrice: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || "", imageUrl: p.imageUrl || "", tokenPrice: p.tokenPrice.toString() });
    setEditingId(p.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Product name is required"); return; }
    const price = parseInt(form.tokenPrice);
    if (!price || price <= 0) { setError("Token price must be positive"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      if (editingId) {
        await merchantProductsApi.update(editingId, { name: form.name, description: form.description, imageUrl: form.imageUrl, tokenPrice: price.toString() });
        setSuccess("Product updated");
      } else {
        await merchantProductsApi.create(form);
        setSuccess("Product created");
      }
      resetForm();
      load();
    } catch (e) { setError(e.response?.data?.error || "Save failed"); }
    setSaving(false);
  };

  const toggleActive = async (p) => {
    try {
      await merchantProductsApi.update(p.id, { isActive: !p.isActive });
      load();
    } catch (e) { setError(e.response?.data?.error || "Toggle failed"); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await merchantProductsApi.delete(p.id);
      setSuccess("Product deleted");
      load();
    } catch (e) { setError(e.response?.data?.error || "Delete failed"); }
  };

  if (loading) return <div className="text-center py-20"><Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Products</h1>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Add Product</Button>}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}<button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button></div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}<button onClick={() => setSuccess("")} className="ml-auto"><X className="w-4 h-4" /></button></div>}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Product" : "New Product"}</CardTitle>
            <CardDescription>Customers can redeem points for this product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div>
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coffee Voucher" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div>
              <Label>Image URL</Label>
              <div className="relative mt-1">
                <Image className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="pl-10" />
              </div>
            </div>
            <div>
              <Label>Token Price *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input type="number" min="1" value={form.tokenPrice} onChange={(e) => setForm({ ...form, tokenPrice: e.target.value })} placeholder="100" className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : (editingId ? "Update" : "Create")}</Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          {products.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No products yet</p>
              <p className="text-xs mt-1">Add your first product for customers to redeem</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4 text-gray-500 max-w-[200px] truncate">{p.description || "-"}</td>
                      <td className="py-2 pr-4 font-mono">{parseInt(p.tokenPrice).toLocaleString()} pts</td>
                      <td className="py-2 pr-4">
                        <Badge variant={p.isActive ? "success" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleActive(p)} title={p.isActive ? "Deactivate" : "Activate"}>
                            <Badge variant={p.isActive ? "secondary" : "success"} className="text-[10px] px-1">{p.isActive ? "Off" : "On"}</Badge>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => remove(p)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
