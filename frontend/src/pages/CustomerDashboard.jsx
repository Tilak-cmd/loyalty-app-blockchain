import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { customerApi } from "../services/endpoints";
import { User, Coins, Award, Gift, TrendingUp, Clock, Loader, CheckCircle, AlertCircle, Mail, MapPin, Calendar, Globe, RefreshCw, Shield } from "lucide-react";
import { OnChainBadge, BlockchainInfo, TxLink } from "../components/BlockchainBadge";

export default function CustomerDashboard() {
  const { customer } = useAuth();
  const [profile, setProfile] = useState(null);
  const [onChainBalance, setOnChainBalance] = useState(null);
  const [onChainMatch, setOnChainMatch] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    Promise.all([
      customerApi.profile().then(r => {
        setProfile(r.data.customer);
        setOnChainBalance(r.data.onChainBalance ?? null);
        setOnChainMatch(r.data.onChainMatch ?? null);
      }).catch(() => {}),
      customerApi.transactions().then(r => setTransactions(r.data.transactions || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [customer]);

  if (!customer) return null;
  if (loading) return <div className="text-center py-20"><Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || customer.email || "Customer";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">My Dashboard</h1>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-xl font-bold">{fullName}</p>
              {profile?.email && <p className="text-sm text-gray-500">{profile.email}</p>}
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-500">Points Balance</p>
              <p className="text-3xl font-bold text-blue-600">{parseInt(profile?.pointsBalance || "0").toLocaleString()}</p>
              <div className="flex items-center gap-1.5 justify-end">
                <OnChainBadge match={onChainMatch} onChainBalance={onChainBalance} />
                {onChainBalance !== null && onChainBalance !== undefined && (
                  <span className="text-xs text-gray-400">on-chain: {BigInt(onChainBalance).toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
          {profile?.username && <p className="text-sm text-gray-400">@{profile.username}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Award className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="text-lg font-bold">{transactions.filter(t => t.type === "AWARD").reduce((s, t) => s + parseInt(t.amount || "0"), 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Gift className="w-6 h-6 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Total Redeemed</p>
              <p className="text-lg font-bold">{transactions.filter(t => t.type === "REDEEM").reduce((s, t) => s + parseInt(t.amount || "0"), 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Transactions</p>
              <p className="text-lg font-bold">{transactions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {profile?.phone && <p className="text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {profile.phone}</p>}
            {profile?.country && <p className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}</p>}
            {profile?.language && <p className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" /> {profile.language}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2"><Shield className="w-4 h-4" /><CardTitle>Blockchain</CardTitle></CardHeader>
          <CardContent>
            <BlockchainInfo
              onChainBalance={onChainBalance}
              onChainMatch={onChainMatch}
              walletAddress={profile?.walletAddress}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No activity yet. Visit a merchant to earn points!</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant={tx.type === "AWARD" ? "success" : "danger"}>{tx.type}</Badge>
                    <span className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="font-medium">{tx.amount} pts</span>
                    <p className="text-xs text-gray-400">{tx.fromAddress}</p>
                    {tx.txHash && <TxLink hash={tx.txHash} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
