import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const Ctx = createContext(null);

export function BlockchainProvider({ children }) {
  const [chainId, setChainId] = useState(null);
  const [explorerUrl, setExplorerUrl] = useState(null);
  const [providerReady, setProviderReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get("/blockchain/info").then(r => {
      setChainId(r.data.chainId);
      setExplorerUrl(r.data.explorerUrl);
      setProviderReady(r.data.providerReady);
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  return (
    <Ctx.Provider value={{ chainId, explorerUrl, providerReady, loaded }}>
      {children}
    </Ctx.Provider>
  );
}

export const useBlockchain = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBlockchain needs BlockchainProvider");
  return c;
};
