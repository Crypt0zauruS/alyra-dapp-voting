import { createContext, useContext, useRef, useEffect, useState } from "react";
import { providers, Contract } from "ethers";
import Web3Modal from "web3modal";
import Voting from "../contracts/Voting.json";

const EthContext = createContext();

export function useEth() {
  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [account, setAccount] = useState("");
  const [owner, setOwner] = useState("");
  const { abi, networks } = Voting;
  const [contractAddress, setContractAddress] = useState("");
  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 5 && chainId !== 1337) {
        window.alert("Merci de vous connecter au réseau Goerli ou Ganache !");
        throw new Error(
          "Merci de vous connecter au réseau Goerli ou Ganache !"
        );
      }
      setContractAddress(networks[chainId].address);
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    } catch (error) {
      console.error(error);
    }
  };

  const getContractInstance = async (providerOrSigner) => {
    return new Contract(contractAddress, abi, providerOrSigner);
  };

  const connectWallet = async () => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        //cacheProvider: true,
        disableInjectedProvider: false,
        providerOptions: {},
      });
    }
    setAccount("");
    setOwner("");
    setWorkflowStatus(null);
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
      await getOwner();
      await getAccount();
      await getWorkFlowStatus();
    } catch (error) {
      console.error(error);
    }
  };

  // Helper function to get owner
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      const owner = await contractInstance.owner();
      setOwner(owner);
    } catch (error) {
      console.error(error);
    }
  };

  // Helper function to get account
  const getAccount = async () => {
    try {
      const provider = await getProviderOrSigner();
      const account = await provider.getSigner().getAddress();
      setAccount(account);
    } catch (error) {
      console.error(error);
    }
  };

  // Helper function to get workflow status
  const getWorkFlowStatus = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      const status = await contractInstance.workflowStatus();
      setWorkflowStatus(status);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    connectWallet();
  }, [walletConnected]);

  // listen to accountsChanged and chainChanged events
  useEffect(() => {
    async function listen(event, callback) {
      window.ethereum.on(event, async function () {
        callback();
      });
    }
    async function connect() {
      setWalletConnected(false);
    }
    listen("accountsChanged", connect);
    listen("chainChanged", connect);
  }, []);

  return {
    connectWallet,
    getProviderOrSigner,
    getContractInstance,
    account,
    owner,
    workflowStatus,
    walletConnected,
    getWorkFlowStatus,
  };
}

export function EthProvider({ children }) {
  const {
    connectWallet,
    getProviderOrSigner,
    getContractInstance,
    account,
    owner,
    workflowStatus,
    walletConnected,
    getWorkFlowStatus,
  } = useEth();

  return (
    <EthContext.Provider
      value={{
        connectWallet,
        getProviderOrSigner,
        getContractInstance,
        account,
        owner,
        workflowStatus,
        walletConnected,
        getWorkFlowStatus,
      }}
    >
      {children}
    </EthContext.Provider>
  );
}

export const useEthContext = () => useContext(EthContext);
