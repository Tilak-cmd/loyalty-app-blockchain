import { useState } from "react";
import { CheckCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { useBlockchain } from "../contexts/BlockchainContext";
import { Badge } from "./ui/badge";

export function OnChainBadge({ match, onChainBalance }) {
  if (onChainBalance === null || onChainBalance === undefined) return null;
  if (match === true) {
    return <Badge variant="success" size="sm"><CheckCircle className="w-3 h-3" /> Verified</Badge>;
  }
  return <Badge variant="warning" size="sm"><AlertTriangle className="w-3 h-3" /> Balance mismatch</Badge>;
}

function useExplorerUrl() {
  let url = "https://sepolia.etherscan.io";
  try { const ctx = useBlockchain(); if (ctx.explorerUrl) url = ctx.explorerUrl; } catch {}
  return url;
}

export function ContractLink({ address, label }) {
  if (!address?.startsWith("0x")) return null;
  const explorerUrl = useExplorerUrl();
  if (!explorerUrl) return <span className="text-xs text-text-tertiary font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>;
  return (
    <a href={`${explorerUrl}/address/${address}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline font-mono">
      {label || `${address.slice(0, 6)}...${address.slice(-4)}`} <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function TxLink({ hash }) {
  if (!hash || typeof hash !== "string") return null;
  if (!hash.startsWith("0x")) return <span className="text-xs text-text-tertiary font-mono">{hash}</span>;
  const explorerUrl = useExplorerUrl();
  if (!explorerUrl) return <span className="text-xs text-text-tertiary font-mono">{hash.slice(0, 10)}...{hash.slice(-6)}</span>;
  return (
    <a href={`${explorerUrl}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline font-mono">
      {hash.slice(0, 10)}...{hash.slice(-6)} <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function AddressDisplay({ address, label }) {
  if (!address) return null;
  return (
    <div className="text-xs text-text-tertiary">
      <span className="font-medium">{label || "Address"}:</span>{" "}
      <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
    </div>
  );
}

export function BlockchainInfo({ tokenContract, walletAddress, onChainBalance, onChainMatch }) {
  const [expanded, setExpanded] = useState(false);
  const connected = onChainBalance !== null && onChainBalance !== undefined;
  const pendingDeployment = !tokenContract && !connected;

  return (
    <div className="bg-surface-secondary border border-border-primary rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${pendingDeployment ? "text-amber-400" : "text-emerald-500"}`} />
          <span className="text-sm font-medium text-text-primary">
            {connected ? "Blockchain Verified" : pendingDeployment ? "Pending Deployment" : "Blockchain"}
          </span>
          {pendingDeployment ? (
            <Badge variant="warning" size="sm">Awaiting admin</Badge>
          ) : (
            <OnChainBadge match={onChainMatch} onChainBalance={onChainBalance} />
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          {expanded ? "Less" : "Details"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 pt-1 border-t border-border-primary">
          {pendingDeployment && (
            <p className="text-xs text-text-tertiary">Token contract not yet deployed. Admin approval will deploy it.</p>
          )}
          {tokenContract && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Token Contract</span>
              <ContractLink address={tokenContract} />
            </div>
          )}
          {walletAddress && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Wallet</span>
              <AddressDisplay address={walletAddress} />
            </div>
          )}
          {connected && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">On-Chain Balance</span>
              <span className="font-mono font-medium">{BigInt(onChainBalance).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
