import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardStat } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input, Label, Select } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs } from "../components/ui/tabs";
import { Table, THead, TBody, TRow, THeadCell, TCell } from "../components/ui/table";
import { EmptyState, LoadingState, ErrorState } from "../components/ui/empty-state";
import { SkeletonCard } from "../components/ui/skeleton";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { adminApi, transactionsApi } from "../services/endpoints";
import {
  Shield, Store, Users, CheckCircle, XCircle, Clock, AlertCircle,
  TrendingUp, RefreshCw, Search, Coins, DollarSign, Loader, ArrowRight,
  Activity, Server, Ban, UserCheck, CreditCard, Wallet, BarChart3, PieChart,
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "pending", label: "Pending Approvals", icon: Clock },
  { key: "merchants", label: "Merchants", icon: Store },
  { key: "transactions", label: "Transactions", icon: BarChart3 },
  { key: "revenue", label: "Revenue", icon: PieChart },
  { key: "topup", label: "Top Up", icon: Coins },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [pendingMerchants, setPendingMerchants] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [merchantSearch, setMerchantSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, merchantsRes] = await Promise.all([
        adminApi.stats().catch(() => ({ data: {} })),
        adminApi.pending().catch(() => ({ data: { merchants: [] } })),
        adminApi.merchants().catch(() => ({ data: { merchants: [] } })),
      ]);
      setStats(statsRes.data);
      setPendingMerchants(pendingRes.data.merchants || []);
      setMerchants(merchantsRes.data.merchants || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id, name) => {
    try {
      await adminApi.approve(id);
      setSuccess(`${name} approved! Token contract deployed.`);
      load();
    } catch (e) { setError(e.response?.data?.error || "Approval failed"); }
  };

  const reject = async (id, name) => {
    try {
      await adminApi.reject(id);
      setSuccess(`${name} rejected.`);
      load();
    } catch (e) { setError(e.response?.data?.error || "Rejection failed"); }
  };

  const filteredMerchants = merchants.filter(m =>
    m.businessName?.toLowerCase().includes(merchantSearch.toLowerCase())
  );

  if (loading && !stats) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <SkeletonCard />
        <div className="grid gap-4 md:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
            <p className="text-sm text-text-tertiary">Platform management &amp; oversight</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4" />
        </Button>
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

      <Tabs
        tabs={TABS}
        value={tab}
        onChange={(k) => { setTab(k); setError(""); setSuccess(""); }}
        variant="pills"
      />

      {tab === "overview" && (
        <OverviewTab stats={stats} />
      )}
      {tab === "pending" && (
        <PendingTab merchants={pendingMerchants} onApprove={approve} onReject={reject} />
      )}
      {tab === "merchants" && (
        <MerchantsTab merchants={filteredMerchants} search={merchantSearch} onSearch={setMerchantSearch} />
      )}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "revenue" && (
        <RevenueTab />
      )}
      {tab === "topup" && (
        <TopUpTab merchants={merchants} onSuccess={load} />
      )}
    </div>
  );
}

function OverviewTab({ stats }) {
  if (!stats) return <LoadingState />;
  const s = stats.stats || stats;

  const cards = [
    { label: "Total Merchants", value: s.totalMerchants || 0, icon: Store, color: "bg-brand-50 text-brand-600" },
    { label: "Approved", value: s.approvedMerchants || 0, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Customers", value: s.totalCustomers || 0, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Transactions", value: s.totalTransactions || 0, icon: Activity, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} hover>
            <CardContent className="pt-5">
              <CardStat label={c.label} value={c.value.toLocaleString()} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Server className="w-4 h-4" /> Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-primary">
              <span className="text-sm text-text-tertiary">Merchants Approved</span>
              <span className="text-sm font-medium">{s.approvedMerchants || 0} / {s.totalMerchants || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-primary">
              <span className="text-sm text-text-tertiary">Pending Approvals</span>
              <span className="text-sm font-medium text-amber-600">{s.pendingMerchants || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-primary">
              <span className="text-sm text-text-tertiary">Platform Revenue</span>
              <span className="text-sm font-medium text-emerald-600">{s.totalRevenueTokens || "0"} tokens</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-tertiary">System Status</span>
              <Badge variant="success" size="sm" dot>Operational</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Transaction Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-primary">
              <span className="text-sm text-text-tertiary">Total Fee Revenue</span>
              <span className="text-sm font-medium text-emerald-600">
                {s.totalRevenueTokens || "0"} pts
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-primary">
              <span className="text-sm text-text-tertiary">Total NPR Processed</span>
              <span className="text-sm font-medium text-brand-600">
                NPR {s.totalRevenueNPR || "0"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-tertiary">Total Transactions</span>
              <span className="text-sm font-medium">{(s.totalTransactions || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PendingTab({ merchants, onApprove, onReject }) {
  const [actionLoading, setActionLoading] = useState(null);

  const handleApprove = async (id, name) => {
    setActionLoading(id);
    await onApprove(id, name);
    setActionLoading(null);
  };

  const handleReject = async (id, name) => {
    setActionLoading(id);
    await onReject(id, name);
    setActionLoading(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Pending Approvals</CardTitle>
        <CardDescription>{merchants.length} merchant{merchants.length !== 1 ? "s" : ""} waiting for review</CardDescription>
      </CardHeader>
      <CardContent>
        {merchants.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All caught up"
            description="No pending merchant applications to review"
          />
        ) : (
          <Table>
            <THead>
              <TRow>
                <THeadCell>Business</THeadCell>
                <THeadCell>Email</THeadCell>
                <THeadCell>Phone</THeadCell>
                <THeadCell>Country</THeadCell>
                <THeadCell>Actions</THeadCell>
              </TRow>
            </THead>
            <TBody>
              {merchants.map((m) => (
                <TRow key={m.id}>
                  <TCell><span className="font-medium text-text-primary">{m.businessName}</span></TCell>
                  <TCell><span className="text-text-secondary">{m.email}</span></TCell>
                  <TCell><span className="text-text-secondary">{m.phone || "-"}</span></TCell>
                  <TCell><span className="text-text-secondary">{m.country || "-"}</span></TCell>
                  <TCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(m.id, m.businessName)}
                        loading={actionLoading === m.id}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReject(m.id, m.businessName)}
                        disabled={actionLoading === m.id}
                      >
                        Reject
                      </Button>
                    </div>
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

function MerchantsTab({ merchants, search, onSearch }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" /> All Merchants</CardTitle>
        <CardDescription>{merchants.length} merchant{merchants.length !== 1 ? "s" : ""} on the platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            className="flex h-10 w-full rounded-xl border border-border-primary bg-surface pl-10 pr-4 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {merchants.length === 0 ? (
          <EmptyState
            icon={Store}
            title={search ? "No merchants found" : "No merchants registered"}
            description={search ? "Try a different search term" : "Merchants will appear here once they register"}
          />
        ) : (
          <Table>
            <THead>
              <TRow>
                <THeadCell>Business</THeadCell>
                <THeadCell>Email</THeadCell>
                <THeadCell>Status</THeadCell>
                <THeadCell sortable>Balance</THeadCell>
                <THeadCell>Plan</THeadCell>
              </TRow>
            </THead>
            <TBody>
              {merchants.map((m) => (
                <TRow key={m.id}>
                  <TCell><span className="font-medium text-text-primary">{m.businessName}</span></TCell>
                  <TCell><span className="text-text-secondary">{m.email}</span></TCell>
                  <TCell>
                    <Badge variant={m.kybStatus === "APPROVED" ? "success" : m.kybStatus === "PENDING" ? "warning" : "danger"} size="sm" dot>
                      {m.kybStatus || "UNKNOWN"}
                    </Badge>
                  </TCell>
                  <TCell><span className="font-medium">{parseInt(m.tokenBalance || "0").toLocaleString()}</span></TCell>
                  <TCell><span className="text-text-secondary">{m.plan || "FREE"}</span></TCell>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionsTab() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionsApi.all({ limit: 100 })
      .then(r => setTxs(r.data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState title="Loading transactions..." />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> All Transactions
        </CardTitle>
        <CardDescription>{txs.length} transaction{txs.length !== 1 ? "s" : ""} on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {txs.length === 0 ? (
          <EmptyState icon={BarChart3} title="No transactions yet" description="Platform activity will appear here" />
        ) : (
          <Table>
            <THead>
              <TRow>
                <THeadCell sortable>Date</THeadCell>
                <THeadCell>Type</THeadCell>
                <THeadCell>Merchant</THeadCell>
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
                  <TCell><span className="text-sm font-medium">{tx.merchant?.businessName || "—"}</span></TCell>
                  <TCell><span className="text-sm text-text-secondary">
                    {tx.customer ? [tx.customer.firstName, tx.customer.lastName].filter(Boolean).join(" ") || tx.customer.email : "—"}
                  </span></TCell>
                  <TCell><span className="text-sm text-text-secondary">{tx.product?.name || "—"}</span></TCell>
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
                        : (tx.txHash?.length > 16 ? tx.txHash.slice(0, 12) + "..." : tx.txHash || "-")}
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

function RevenueTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.revenue().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState title="Loading revenue..." />;
  if (!data) return <ErrorState title="Failed to load revenue" />;

  const totalTokens = data.byMerchant.reduce((s, r) => s + parseInt(r.totalTokens || 0), 0);
  const totalNPR = data.byMerchant.reduce((s, r) => s + parseInt(r.totalNPR || 0), 0);
  const maxToken = Math.max(...data.byMerchant.map(r => parseInt(r.totalTokens || 0)), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover>
          <CardContent className="pt-5">
            <CardStat label="Total Fee Tokens" value={totalTokens.toLocaleString()} icon={Coins} />
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-5">
            <CardStat label="Total NPR Processed" value={`NPR ${totalNPR.toLocaleString()}`} icon={DollarSign} />
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-5">
            <CardStat label="Total Fee Events" value={data.recent.length} icon={BarChart3} />
          </CardContent>
        </Card>
      </div>

      {data.byMerchant.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Revenue by Merchant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byMerchant.map((r) => (
                <div key={r.merchantId || "unknown"}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-text-primary">{r.businessName}</span>
                    <span className="text-text-tertiary">{parseInt(r.totalTokens).toLocaleString()} pts (NPR {parseInt(r.totalNPR).toLocaleString()})</span>
                  </div>
                  <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(parseInt(r.totalTokens || 0) / maxToken) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Recent Fee Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TRow>
                  <THeadCell>Date</THeadCell>
                  <THeadCell>Merchant</THeadCell>
                  <THeadCell>Type</THeadCell>
                  <THeadCell sortable>Fee Tokens</THeadCell>
                  <THeadCell sortable>NPR Amount</THeadCell>
                </TRow>
              </THead>
              <TBody>
                {data.recent.slice(0, 20).map((r) => (
                  <TRow key={r.id}>
                    <TCell><span className="text-xs text-text-tertiary">{new Date(r.createdAt).toLocaleDateString()}</span></TCell>
                    <TCell><span className="font-medium text-text-primary">{r.merchantName || "—"}</span></TCell>
                    <TCell><Badge size="sm" variant="success">{r.type}</Badge></TCell>
                    <TCell><span className="font-medium">{parseInt(r.tokenAmount).toLocaleString()}</span></TCell>
                    <TCell><span className="text-text-secondary">NPR {parseInt(r.amountNPR).toLocaleString()}</span></TCell>
                  </TRow>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TopUpTab({ merchants, onSuccess }) {
  const [merchantId, setMerchantId] = useState("");
  const [amountNPR, setAmountNPR] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedMerchant = merchants.find(m => m.id === merchantId);
  const exchangeRate = selectedMerchant?.exchangeRate || 100;
  const feeRate = selectedMerchant?.feeRate || 5;
  const estimatedTokens = Math.floor((parseFloat(amountNPR || "0") * exchangeRate / 100) * (100 - feeRate) / 100);

  const handleTopUp = async () => {
    if (!merchantId || !amountNPR || +amountNPR <= 0) { setError("Select merchant and enter amount"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await adminApi.topup(merchantId, { amountNPR: +amountNPR });
      setSuccess(`${amountNPR} NPR top-up for ${selectedMerchant?.businessName}: ${r.data.tokensAdded || estimatedTokens} tokens added`);
      setMerchantId(""); setAmountNPR("");
      onSuccess();
    } catch (e) { setError(e.response?.data?.error || "Top-up failed"); }
    setLoading(false);
  };

  const merchantOptions = merchants
    .filter(m => m.kybStatus === "APPROVED")
    .map(m => ({ value: m.id, label: m.businessName }));

  return (
    <div className="max-w-2xl animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins className="w-5 h-5" /> Admin Top-Up</CardTitle>
          <CardDescription>Credit tokens to a merchant account</CardDescription>
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
            <Label>Select Merchant</Label>
            <Select
              options={merchantOptions}
              placeholder="Choose a merchant..."
              value={merchantId}
              onChange={(e) => { setMerchantId(e.target.value); setError(""); }}
            />
          </div>
          <div>
            <Label>Amount (NPR)</Label>
            <Input
              type="number" min="1" placeholder="1000"
              value={amountNPR} onChange={(e) => { setAmountNPR(e.target.value); setError(""); }}
              icon={DollarSign}
              disabled={loading}
            />
          </div>

          {selectedMerchant && amountNPR && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-700">Merchant</span>
                <span className="font-medium text-brand-800">{selectedMerchant.businessName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-700">Exchange Rate</span>
                <span className="font-medium text-brand-800">1 NPR = {exchangeRate / 100} pts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-700">Fee</span>
                <span className="font-medium text-brand-800">{feeRate}%</span>
              </div>
              <div className="border-t border-brand-200 pt-2 flex items-center justify-between text-sm">
                <span className="font-medium text-brand-800">Tokens Added</span>
                <span className="font-bold text-lg text-brand-900">
                  ~{estimatedTokens.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={handleTopUp} disabled={loading || !merchantId || !amountNPR} loading={loading}>
            <Coins className="w-4 h-4" /> Apply Top-Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
