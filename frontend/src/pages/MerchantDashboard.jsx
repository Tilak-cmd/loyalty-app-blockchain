import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardStat } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs } from "../components/ui/tabs";
import { Table, THead, TBody, TRow, THeadCell, TCell } from "../components/ui/table";
import { EmptyState, LoadingState, ErrorState } from "../components/ui/empty-state";
import { Skeleton, SkeletonCard } from "../components/ui/skeleton";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { merchantApi, points } from "../services/endpoints";

import MerchantProducts from "./MerchantProducts";
import {
  Store, Award, Gift, Coins, TrendingUp, Users, CheckCircle,
  AlertCircle, Clock, DollarSign, CreditCard, XCircle, Loader,
  RefreshCw, Mail, Package, Wallet, BarChart3, Search,
  ArrowRight, ChevronRight, Plus, Sparkles, Zap, Star,
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: TrendingUp },
  { key: "award", label: "Award Points", icon: Award },
  { key: "products", label: "Products", icon: Package },
  { key: "customers", label: "Customers", icon: Users },
  { key: "transactions", label: "Transactions", icon: BarChart3 },
  { key: "topup", label: "Buy Tokens", icon: Coins },
];

export default function MerchantDashboard() {
  const { merchant } = useAuth();
  const [tab, setTab] = useState("overview");
  const [merchantData, setMerchantData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      setProcessingPayment(true);
      setTab("topup");
      confirmPayment(sessionId);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await merchantApi.status();
      setMerchantData(r.data.merchant);
    } catch {}
    setLoading(false);
  };

  const confirmPayment = async (sessionId) => {
    try {
      const r = await merchantApi.checkoutSuccess({ sessionId });
      setSuccess(`Payment confirmed! ${r.data.netTokens} tokens added.`);
      load();
    } catch (e) {
      setError(e.response?.data?.error || "Payment confirmation failed");
    }
    setProcessingPayment(false);
  };

  if (!merchant) return null;

  const isPending = merchant?.kybStatus === "PENDING" || merchantData?.kybStatus === "PENDING";
  const isRejected = merchant?.kybStatus === "REJECTED" || merchantData?.kybStatus === "REJECTED";
  const isApproved = merchantData?.kybStatus === "APPROVED";

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
            <Store className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Merchant Dashboard</h1>
            <p className="text-sm text-text-tertiary">{merchantData?.businessName || merchant.businessName}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto"><XCircle className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          <button onClick={() => setSuccess("")} className="ml-auto"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      {processingPayment && (
        <Card className="bg-brand-50 border-brand-200">
          <CardContent className="pt-5 flex items-center gap-4">
            <Loader className="w-6 h-6 animate-spin text-brand-600 shrink-0" />
            <div>
              <p className="font-medium text-brand-800">Processing your payment...</p>
              <p className="text-sm text-brand-700">Please wait while we confirm your Stripe payment.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isPending && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-5 flex items-center gap-4">
            <Clock className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Application Pending</p>
              <p className="text-sm text-amber-700">Your registration is under review. You'll be able to use the platform once approved.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-5 flex items-center gap-4">
            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Application Rejected</p>
              <p className="text-sm text-red-700">Your merchant application was not approved. Contact the admin for details.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isApproved && (
        <>
          <Tabs
            tabs={TABS}
            value={tab}
            onChange={(k) => { setTab(k); setError(""); setSuccess(""); }}
            variant="pills"
          />

          {tab === "overview" && (
            <OverviewTab merchantData={merchantData} load={load} />
          )}
          {tab === "award" && (
            <AwardTab merchantData={merchantData} load={load} />
          )}
          {tab === "products" && <ProductsTab />}
          {tab === "customers" && <CustomersTab />}
          {tab === "transactions" && <TransactionsTab />}
          {tab === "topup" && (
            <TopUpTab merchantData={merchantData} load={load} />
          )}
        </>
      )}
    </div>
  );
}

function OverviewTab({ merchantData, load }) {
  const balance = parseInt(merchantData?.tokenBalance || "0");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hover>
          <CardContent className="pt-5">
            <CardStat label="Token Balance" value={`${balance.toLocaleString()} pts`} icon={Coins} />
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-5">
            <CardStat
              label="Exchange Rate"
              value={`1 NPR = ${(merchantData?.exchangeRate || 100) / 100} pts`}
              icon={TrendingUp}
            />
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-5">
            <CardStat label="Platform Fee" value={`${merchantData?.feeRate || 5}%`} icon={Award} />
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-5">
            <CardStat label="Plan" value={merchantData?.plan || "FREE"} icon={BadgeCheck} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Store className="w-4 h-4" /> Business Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-primary">
              <span className="text-sm text-text-tertiary">Business Name</span>
              <span className="text-sm font-medium text-text-primary">{merchantData?.businessName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-primary">
              <span className="text-sm text-text-tertiary">Email</span>
              <span className="text-sm text-text-primary">{merchantData?.email}</span>
            </div>
            {merchantData?.phone && (
              <div className="flex items-center justify-between py-2 border-b border-border-primary">
                <span className="text-sm text-text-tertiary">Phone</span>
                <span className="text-sm text-text-primary">{merchantData.phone}</span>
              </div>
            )}
            {merchantData?.country && (
              <div className="flex items-center justify-between py-2 border-b border-border-primary">
                <span className="text-sm text-text-tertiary">Location</span>
                <span className="text-sm text-text-primary">{merchantData.country} ({merchantData.currency})</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-tertiary">Status</span>
              <Badge variant="success" size="sm" dot>Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Store className="w-4 h-4" /> Token Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {merchantData?.tokenContract && (
              <div className="flex items-center justify-between py-2 border-b border-border-primary">
                <span className="text-sm text-text-tertiary">Token Contract</span>
                <a href={`https://sepolia.etherscan.io/address/${merchantData.tokenContract}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:underline font-mono">
                  {merchantData.tokenContract.slice(0, 6)}...{merchantData.tokenContract.slice(-4)}
                </a>
              </div>
            )}
            {merchantData?.walletAddress && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-tertiary">Wallet</span>
                <span className="text-xs font-mono text-text-secondary">
                  {merchantData.walletAddress.slice(0, 6)}...{merchantData.walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AwardTab({ merchantData, load }) {
  const [customerEmail, setCustomerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const timerRef = useState(null);

  const lookupCustomer = (email) => {
    setCustomerEmail(email);
    if (!email) { setCustomerInfo(null); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      points.balanceByEmail(email).then((r) => setCustomerInfo(r.data)).catch(() => setCustomerInfo(null));
    }, 400);
  };

  const awardPoints = async () => {
    if (!customerEmail || !amount || +amount <= 0) { setError("Fill all fields"); return; }
    if (+amount > parseInt(merchantData?.tokenBalance || "0")) { setError("Insufficient token balance"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await merchantApi.award({ customerEmail, amount: amount.toString() });
      const txDisplay = r.data.onChainTx?.hash ? r.data.onChainTx.hash.slice(0, 16) + "..." : "DB-only";
      setSuccess(`Awarded ${amount} points to ${customerEmail}! Tx: ${txDisplay}`);
      setCustomerEmail(""); setAmount(""); setCustomerInfo(null);
      load();
    } catch (e) { setError(e.response?.data?.error || "Award failed"); }
    setLoading(false);
  };

  const balance = parseInt(merchantData?.tokenBalance || "0");

  return (
    <div className="max-w-2xl animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> Award Points</CardTitle>
          <CardDescription>Send loyalty points to a customer by email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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

          <div>
            <Label>Customer Email</Label>
            <Input
              type="email" placeholder="customer@example.com"
              value={customerEmail} onChange={(e) => lookupCustomer(e.target.value)}
              icon={Mail}
            />
            {customerInfo && (
              <p className="mt-1.5 text-xs text-text-tertiary flex items-center gap-1">
                {customerInfo.found ? (
                  <><CheckCircle className="w-3 h-3 text-emerald-500" /> Existing customer</>
                ) : (
                  <><Sparkles className="w-3 h-3 text-brand-500" /> New customer (will be created)</>
                )}
              </p>
            )}
          </div>

          <div>
            <Label>Points to Award</Label>
            <Input type="number" min="1" placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="bg-surface-secondary rounded-xl p-4 space-y-2 border border-border-primary">
            <p className="text-sm text-text-secondary">
              Your balance: <strong className="text-text-primary">{balance.toLocaleString()}</strong> tokens
            </p>
            {merchantData?.tokenContract && (
              <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <span>Token:</span>
                <a href={`https://sepolia.etherscan.io/address/${merchantData.tokenContract}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-brand-600 hover:underline font-mono">
                  {merchantData.tokenContract.slice(0, 6)}...{merchantData.tokenContract.slice(-4)}
                </a>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={awardPoints} disabled={loading || !customerEmail || !amount} loading={loading}>
            <Award className="w-4 h-4" /> Award Points
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    merchantApi.customers().then(r => setCustomers(r.data.customers || [])).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState title="Loading customers..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Your Customers</CardTitle>
        <CardDescription>{customers.length} customer{customers.length !== 1 ? "s" : ""} earned points from you</CardDescription>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Award points to customers and they will appear here"
          />
        ) : (
          <Table>
            <THead>
              <TRow>
                <THeadCell>Email</THeadCell>
                <THeadCell>Name</THeadCell>
                <THeadCell sortable>Points Awarded</THeadCell>
                <THeadCell sortable>Current Balance</THeadCell>
                <THeadCell>Last Award</THeadCell>
              </TRow>
            </THead>
            <TBody>
              {customers.map((c, i) => (
                <TRow key={c.email || i}>
                  <TCell><span className="text-sm font-medium text-text-primary">{c.email}</span></TCell>
                  <TCell><span className="text-text-secondary">{c.name || "-"}</span></TCell>
                  <TCell><span className="font-medium text-emerald-600">{parseInt(c.totalAwarded).toLocaleString()}</span></TCell>
                  <TCell><span className="font-medium">{parseInt(c.pointsBalance).toLocaleString()}</span></TCell>
                  <TCell><span className="text-xs text-text-tertiary">{c.lastAward ? new Date(c.lastAward).toLocaleDateString() : "-"}</span></TCell>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ProductsTab() {
  return <MerchantProducts />;
}

function TransactionsTab() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    merchantApi.transactions()
      .then(r => setTxs(r.data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState title="Loading transactions..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Transactions
        </CardTitle>
        <CardDescription>{txs.length} transaction{txs.length !== 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        {txs.length === 0 ? (
          <EmptyState icon={BarChart3} title="No transactions yet"
            description="Award points or top up to see transactions here" />
        ) : (
          <Table>
            <THead>
              <TRow>
                <THeadCell sortable>Date</THeadCell>
                <THeadCell>Type</THeadCell>
                <THeadCell>Customer</THeadCell>
                <THeadCell>Product</THeadCell>
                <THeadCell sortable>Amount</THeadCell>
                <THeadCell>Gross</THeadCell>
                <THeadCell>Fee</THeadCell>
                <THeadCell>Tx Hash</THeadCell>
              </TRow>
            </THead>
            <TBody>
              {txs.map((tx, i) => (
                <TRow key={tx.id || i}>
                  <TCell><span className="text-xs text-text-tertiary">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span></TCell>
                  <TCell>
                    <Badge variant={tx.type === "AWARD" ? "success" : tx.type === "REDEEM" ? "warning" : "default"} size="sm">
                      {tx.type}
                    </Badge>
                  </TCell>
                  <TCell><span className="text-sm font-medium">
                    {tx.customer ? [tx.customer.firstName, tx.customer.lastName].filter(Boolean).join(" ") || tx.customer.email : (tx.toAddress || "-")}
                  </span></TCell>
                  <TCell><span className="text-sm text-text-secondary">
                    {tx.product?.name || "-"}
                  </span></TCell>
                  <TCell><span className="font-medium">{parseInt(tx.amount || "0").toLocaleString()}</span></TCell>
                  <TCell><span className="text-xs text-text-tertiary">
                    {tx.grossTokens ? parseInt(tx.grossTokens).toLocaleString() : "-"}
                  </span></TCell>
                  <TCell><span className="text-xs text-red-500">
                    {tx.feeTokens ? `-${parseInt(tx.feeTokens).toLocaleString()}` : "-"}
                  </span></TCell>
                  <TCell>
                    <span className="text-xs font-mono text-brand-600" title={tx.txHash}>
                      {tx.txHash?.startsWith?.("0x")
                        ? tx.txHash.slice(0, 8) + "..."
                        : (tx.txHash?.slice(0, 12) + "...")}
                    </span>
                  </TCell>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TopUpTab({ merchantData, load }) {
  const [amountNPR, setAmountNPR] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const buyTokens = async () => {
    if (!amountNPR || +amountNPR <= 0) { setError("Enter amount"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await merchantApi.createCheckoutSession({ amountNPR: +amountNPR });
      window.location.href = r.data.url;
    } catch (e) {
      const code = e.response?.data?.code;
      const msg = e.response?.data?.error || "Failed to create checkout session";
      if (code === "NOT_MERCHANT") setError("You are logged in with a non-merchant account. Please sign out and log in as a merchant.");
      else if (code === "KYB_NOT_APPROVED") setError("Your merchant account hasn't been approved yet. Contact the admin.");
      else if (code === "INVALID_TOKEN") setError("Session expired. Please log out and sign in again.");
      else setError(msg);
      setLoading(false);
    }
  };

  const exchangeRate = (merchantData?.exchangeRate || 100) / 100;
  const feeRate = merchantData?.feeRate || 5;
  const estimatedTokens = Math.floor((parseFloat(amountNPR || "0") * exchangeRate) * (100 - feeRate) / 100);

  return (
    <div className="max-w-2xl animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins className="w-5 h-5" /> Buy Tokens</CardTitle>
          <CardDescription>Purchase loyalty tokens via Stripe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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

          <div>
            <Label>Amount (NPR)</Label>
            <Input
              type="number" min="1" placeholder="1000"
              value={amountNPR} onChange={(e) => { setAmountNPR(e.target.value); setError(""); }}
              icon={DollarSign}
              disabled={loading}
            />
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-700">Exchange Rate</span>
              <span className="font-medium text-brand-800">1 NPR = {exchangeRate} pts</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-700">Platform Fee</span>
              <span className="font-medium text-brand-800">{feeRate}%</span>
            </div>
            <div className="border-t border-brand-200 pt-2 flex items-center justify-between text-sm">
              <span className="font-medium text-brand-800">You Get</span>
              <span className="font-bold text-lg text-brand-900">
                ~{estimatedTokens.toLocaleString()} tokens
              </span>
            </div>
          </div>

          <Button className="w-full" onClick={buyTokens} disabled={loading || !amountNPR} loading={loading}>
            <CreditCard className="w-4 h-4" /> Pay with Card
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BadgeCheck(props) {
  return <CheckCircle className="w-4 h-4 text-emerald-500" />;
}
