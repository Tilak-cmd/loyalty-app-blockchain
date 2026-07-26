import { CheckCircle, AlertTriangle, WifiOff, ExternalLink } from "lucide-react";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

export function OnChainBadge({ match, onChainBalance, tokenContract }) {
  if (onChainBalance === null || onChainBalance === undefined) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <WifiOff className="w-3 h-3" /> Offline
      </span>
    );
  }
  if (match === true) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" /> On-Chain ✓
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <AlertTriangle className="w-3 h-3" /> Balance Mismatch
    </span>
  );
}

export function ContractLink({ address, label }) {
  if (!address || !address.startsWith("0x")) return null;
  return (
    <a href={`${SEPOLIA_EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-mono">
      {label || address.slice(0, 6) + "..." + address.slice(-4)} <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function TxLink({ hash }) {
  if (!hash || typeof hash !== "string") return null;
  if (!hash.startsWith("0x")) return <span className="text-xs text-gray-400 font-mono">{hash}</span>;
  return (
    <a href={`${SEPOLIA_EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-mono">
      {hash.slice(0, 10)}...{hash.slice(-6)} <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function AddressDisplay({ address, label }) {
  if (!address) return null;
  return (
    <div className="text-xs text-gray-500">
      <span className="font-medium">{label || "Address"}:</span>{" "}
      <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
    </div>
  );
}

export function BlockchainInfo({ tokenContract, walletAddress, onChainBalance, onChainMatch }) {
  const connected = onChainBalance !== null && onChainBalance !== undefined;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1">
        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg" alt="ETH" className="w-3 h-3" />
        Blockchain
        <OnChainBadge match={onChainMatch} onChainBalance={onChainBalance} />
      </div>
      {!connected && (
        <p className="text-xs text-gray-400">Blockchain provider not connected — balances are database-only.</p>
      )}
      {tokenContract && <div className="flex items-center gap-1 text-xs"><span className="text-gray-500">Token:</span> <ContractLink address={tokenContract} /></div>}
      {walletAddress && <AddressDisplay address={walletAddress} label="Wallet" />}
    </div>
  );
}
