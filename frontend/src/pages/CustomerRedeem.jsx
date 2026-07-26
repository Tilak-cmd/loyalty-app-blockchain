import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDesc } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { publicMerchantApi, points } from "../services/endpoints";
import { Gift, Store, AlertCircle, CheckCircle, Loader, ArrowLeft, Coins, Package } from "lucide-react";

export default function CustomerRedeem() {
  const { customer } = useAuth();
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!customer) return;
    Promise.all([
      publicMerchantApi.list().then(r => setMerchants(r.data.merchants)).catch(() => {}),
      points.balanceByEmail(customer.email).then(r => setProfile(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [customer]);

  const selectMerchant = async (m) => {
    setSelectedMerchant(m);
    setProductsLoading(true);
    setError("");
    try {
      const r = await publicMerchantApi.products(m.id);
      setProducts(r.data.products || []);
    } catch (e) { setError(e.response?.data?.error || "Failed to load products"); }
    setProductsLoading(false);
  };

  const redeem = async (product) => {
    if (!selectedMerchant) return;
    if (!window.confirm(`Redeem ${parseInt(product.tokenPrice).toLocaleString()} points for "${product.name}"?`)) return;
    setRedeeming(true); setError(""); setSuccess("");
    try {
      const r = await points.redeem({ merchantId: selectedMerchant.id, productId: product.id });
      setSuccess(`Redeemed! Enjoy your "${r.data.product.name}". Tx: ${r.data.tx.txHash?.slice(0, 16)}...`);
      // Refresh balance
      const b = await points.balanceByEmail(customer.email);
      setProfile(b.data);
      // Remove redeemed product from list
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (e) { setError(e.response?.data?.error || "Redemption failed"); }
    setRedeeming(false);
  };

  if (!customer) return null;
  if (loading) return <div className="text-center py-20"><Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

  const balance = parseInt(profile?.balance || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Gift className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Redeem Points</h1>
      </div>

      <Card className="bg-gradient-to-br from-green-50 border-green-200">
        <CardContent className="pt-4 flex items-center gap-3">
          <Coins className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Your Balance</p>
            <p className="text-2xl font-bold">{balance.toLocaleString()} points</p>
          </div>
        </CardContent>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      {selectedMerchant ? (
        <>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setSelectedMerchant(null); setProducts([]); setError(""); }}>
              <ArrowLeft className="w-4 h-4 mr-1" />Back
            </Button>
            <span className="text-sm text-gray-500">Browsing:</span>
            <span className="font-semibold">{selectedMerchant.businessName}</span>
          </div>

          {productsLoading ? (
            <div className="text-center py-10"><Loader className="w-6 h-6 animate-spin mx-auto text-blue-600" /></div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10 text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No products available</p>
                <p className="text-xs mt-1">This merchant hasn't added any redeemable products yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const price = parseInt(p.tokenPrice);
                const canAfford = balance >= price;
                return (
                  <Card key={p.id} className={canAfford ? "" : "opacity-60"}>
                    <CardContent className="pt-4 space-y-3">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover rounded-lg" onError={(e) => { e.target.style.display = "none"; }} />
                      )}
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-500 mt-1">{p.description}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="text-xs">{price.toLocaleString()} pts</Badge>
                        {!canAfford && <span className="text-xs text-red-500">Need {Intl.NumberFormat().format(price - balance)} more</span>}
                      </div>
                      <Button className="w-full" onClick={() => redeem(p)} disabled={!canAfford || redeeming} size="sm">
                        {redeeming ? "Redeeming..." : canAfford ? "Redeem" : "Not Enough Points"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500">Select a merchant to browse their redeemable products</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {merchants.map((m) => (
              <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectMerchant(m)}>
                <CardContent className="pt-4 flex items-center gap-3">
                  {m.logo ? (
                    <img src={m.logo} alt={m.businessName} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Store className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{m.businessName}</p>
                    <p className="text-xs text-gray-500">{m.country || ""} {m.currency ? `(${m.currency})` : ""}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {merchants.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No merchants available</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
