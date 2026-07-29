import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { EmptyState, LoadingState, ErrorState } from "../components/ui/empty-state";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { publicMerchantApi, points } from "../services/endpoints";
import {
  Gift, Store, Coins, Package, ArrowLeft, Search, CheckCircle,
  AlertCircle, Loader, Star, ChevronRight, Sparkles, Wallet,
} from "lucide-react";

export default function CustomerRedeem() {
  const { customer } = useAuth();
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [products, setProducts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [redeemDialog, setRedeemDialog] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!customer) return;
    Promise.all([
      publicMerchantApi.list().then(r => setMerchants(r.data.merchants || [])),
      customer.email ? points.balanceByEmail(customer.email).then(r => setBalance(parseInt(r.data.balance || "0"))) : Promise.resolve(),
    ]).catch(() => {}).finally(() => setLoading(false));
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

  const confirmRedeem = async () => {
    if (!redeemDialog || !selectedMerchant) return;
    setRedeeming(true); setError(""); setSuccess("");
    try {
      const r = await points.redeem({ merchantId: selectedMerchant.id, productId: redeemDialog.id });
      setSuccess(`"${r.data.product.name}" redeemed!`);
      if (customer.email) {
        const b = await points.balanceByEmail(customer.email);
        setBalance(parseInt(b.data.balance || "0"));
      }
      setProducts(prev => prev.filter(p => p.id !== redeemDialog.id));
      setRedeemDialog(null);
    } catch (e) { setError(e.response?.data?.error || "Redemption failed"); }
    setRedeeming(false);
  };

  if (!customer) return null;
  if (loading) return <LoadingState title="Loading merchants..." />;

  const filteredMerchants = merchants.filter(m =>
    m.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Redeem Points</h1>
          <p className="text-sm text-text-tertiary mt-0.5">Browse merchants and swap points for rewards</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <Coins className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-xs text-emerald-700 font-medium">Your Balance</p>
            <p className="text-lg font-bold text-emerald-700 -mt-0.5">{balance.toLocaleString()} pts</p>
          </div>
        </div>
      </div>

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

      {selectedMerchant ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => { setSelectedMerchant(null); setProducts([]); setError(""); }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="h-8 w-px bg-border-primary" />
            <span className="text-sm text-text-tertiary">Browsing</span>
            <span className="font-semibold text-text-primary">{selectedMerchant.businessName}</span>
          </div>

          {productsLoading ? (
            <LoadingState title="Loading products..." />
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products available"
              description="This merchant hasn't added any redeemable products yet."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p, i) => {
                const price = parseInt(p.tokenPrice);
                const canAfford = balance >= price;
                return (
                  <Card key={p.id} hover className={cn("animate-slide-up", !canAfford && "opacity-60")}
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="pt-5 space-y-4">
                      {p.imageUrl && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-surface-tertiary">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = "none"; }} />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-text-primary">{p.name}</p>
                        {p.description && <p className="text-sm text-text-tertiary mt-1">{p.description}</p>}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="brand" size="md">
                          <Coins className="w-3 h-3 mr-1" /> {price.toLocaleString()} pts
                        </Badge>
                        {!canAfford && (
                          <span className="text-xs text-red-500 font-medium">
                            Need {Intl.NumberFormat().format(price - balance)} more
                          </span>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        variant={canAfford ? "primary" : "secondary"}
                        disabled={!canAfford}
                        onClick={() => setRedeemDialog(p)}
                      >
                        {canAfford ? "Redeem Now" : "Not Enough Points"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              className="flex h-10 w-full rounded-xl border border-border-primary bg-surface pl-10 pr-4 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              placeholder="Search merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredMerchants.length === 0 ? (
            <EmptyState
              icon={Store}
              title={search ? "No merchants found" : "No merchants available"}
              description={search ? "Try a different search term" : "Check back later for new merchants"}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMerchants.map((m, i) => (
                <Card key={m.id} hover className="cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => selectMerchant(m)}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-3">
                      {m.logo ? (
                        <img src={m.logo} alt={m.businessName} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                          <Store className="w-6 h-6 text-brand-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary truncate">{m.businessName}</p>
                        <p className="text-xs text-text-tertiary">
                          {m.country || ""}{m.currency ? ` (${m.currency})` : ""}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-tertiary ml-auto shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <Sparkles className="w-3 h-3" /> Loyalty active
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!redeemDialog} onClose={() => setRedeemDialog(null)} size="sm">
        <DialogHeader onClose={() => setRedeemDialog(null)}>
          <DialogTitle>Confirm Redemption</DialogTitle>
          <DialogDescription>You're about to redeem points for this reward</DialogDescription>
        </DialogHeader>
        <DialogContent className="space-y-4">
          {redeemDialog && (
            <>
              <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{redeemDialog.name}</p>
                  {redeemDialog.description && (
                    <p className="text-xs text-text-tertiary">{redeemDialog.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Cost</span>
                <span className="font-semibold text-text-primary">
                  {parseInt(redeemDialog.tokenPrice).toLocaleString()} points
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Your Balance</span>
                <span className="font-semibold text-text-primary">{balance.toLocaleString()} points</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">After Redemption</span>
                <span className={cn(
                  "font-semibold",
                  balance - parseInt(redeemDialog.tokenPrice) >= 0 ? "text-emerald-600" : "text-red-500",
                )}>
                  {(balance - parseInt(redeemDialog.tokenPrice)).toLocaleString()} points
                </span>
              </div>
            </>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setRedeemDialog(null)} disabled={redeeming}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmRedeem} loading={redeeming}>
            Confirm Redemption
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
