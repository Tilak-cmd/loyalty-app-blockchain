import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const Ctx = createContext(null);

export function BlockchainProvider({ children }) {
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState(null);
  const [explorerUrl, setExplorerUrl] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [rpcUrl, setRpcUrl] = useState(null);
  const [providerReady, setProviderReady] = useState(false);
  const [contracts, setContracts] = useState({});
  const [adminWallet, setAdminWallet] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/blockchain/info"),
      api.get("/blockchain/contracts"),
      api.get("/blockchain/admin-wallet"),
    ]).then(([info, contractsRes, adminRes]) => {
      setChainId(info.data.chainId);
      setNetworkName(info.data.networkName);
      setExplorerUrl(info.data.explorerUrl);
      setBlockNumber(info.data.blockNumber);
      setRpcUrl(info.data.rpcUrl);
      setProviderReady(info.data.providerReady);
      setContracts(contractsRes.data.contracts || {});
      setAdminWallet(adminRes.data.adminWallet);
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  return (
    <Ctx.Provider value={{
      chainId, networkName, explorerUrl, blockNumber, rpcUrl,
      providerReady, contracts, adminWallet, loaded,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useBlockchain = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBlockchain needs BlockchainProvider");
  return c;
};
