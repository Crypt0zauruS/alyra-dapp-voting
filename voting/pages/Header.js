import { useEthContext } from "../context/ethContext";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Loader from "..//components/Loader";

const Header = () => {
  //Extract necessary values from the ethContext
  const {
    connectWallet,
    getProviderOrSigner,
    getContractInstance,
    workflowStatus,
    account,
    owner,
    walletConnected,
    walletInstalled,
    getWorkFlowStatus,
  } = useEthContext();

  // Define the state variables
  const [voter, setVoter] = useState("");
  const [voterInfos, setVoterInfos] = useState([]);
  const [loader, setLoader] = useState(false);

  // Array that maps the workflow status to a human-readable string
  const WFSarray = [
    "Enregistrement des votants",
    "Enregistrement des propositions",
    "Terminer l'enregistrement des propositions",
    "Début de la session de vote",
    "Session de vote terminée",
    "Décompte des votes",
    "Session terminée",
  ];

  // Function to get voter information
  const getVoterInfo = async () => {
    if (loader) return;
    if (voter === "") return;
    if (voter === "Vous n'êtes pas votant") {
      setVoter("");
      return;
    }
    //If the input is not a valid Ethereum address, set the voter state to 'Invalid address' and exit the function
    if (!ethers.utils.isAddress(voter)) {
      console.log("adresse invalide");
      setVoter("Adresse invalide");
      return;
    }
    try {
      // Get provider and contract instance
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      // Get Voter information from smart contract
      const voterInfo = await contractInstance.getVoter(voter, {
        from: account,
      });
      //Set the voterInfo state with the retrieved information
      setVoterInfos(voterInfo);
    } catch (err) {
      console.error(err);
      setVoter("Vous n'êtes pas votant");
    }
  };

  // Function to update the workflow status
  const setWorkflowStatus = async (index) => {
    if (loader) return;
    if (!/^\d+$/.test(index) || index > 5 || index < 1) {
      console.log("index invalide");
      return;
    }
    try {
      // Set the loader to active
      setLoader(true);
      // Get signer and contract instance
      const provider = await getProviderOrSigner(true);
      const contractInstance = await getContractInstance(provider);
      let tx;
      // Call the appropriate function based on the index
      if (index === 1) {
        tx = await contractInstance.startProposalsRegistering();
      } else if (index === 2) {
        tx = await contractInstance.endProposalsRegistering();
      } else if (index === 3) {
        tx = await contractInstance.startVotingSession();
      } else if (index === 4) {
        tx = await contractInstance.endVotingSession();
      } else if (index === 5) {
        tx = await contractInstance.tallyVotes();
      }
      // Listen for the WorkflowStatusChange event emitted by the contract
      contractInstance.once(
        "WorkflowStatusChange",
        (previoussStatus, newStatus, event) => {
          console.log(
            "event",
            event,
            "previoussStatus",
            previoussStatus,
            "newStatus",
            newStatus
          );
        }
      );
      // Wait for the transaction to be confirmed
      await tx.wait();
      await getWorkFlowStatus();
    } catch (err) {
      console.log(err);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (!account) {
      setVoterInfos([]);
      setVoter("");
    }
  }, [account]);

  useEffect(() => {
    window.onclick = () => {
      if (voterInfos.length > 0) {
        setVoterInfos([]);
        setVoter("");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="header container-fluid">
      {account && <h1 id="account">Compte: {account}</h1>}
      {account && account === owner && (
        <div>
          <h1 style={{ color: "cyan" }}>Administrateur</h1>
          <button
            disabled={loader}
            onClick={() => setWorkflowStatus(workflowStatus + 1)}
          >
            Etape suivante: {WFSarray[workflowStatus + 1]}
          </button>
          {loader && <Loader />}
        </div>
      )}

      {account && walletConnected && (
        <h1>Actuellement : {WFSarray[workflowStatus]}</h1>
      )}
      {(!account && walletConnected && <h1>Veuillez déverrouiller MetaMask</h1>)}
      {!walletConnected && (
        <button onClick={connectWallet}>Connecter MetaMask</button>
      )}

      {account && (
        <>
          <div>
            <input
              type="text"
              placeholder="Entrer l'adresse d'un votant"
              onChange={(e) => {
                if (voterInfos.length > 0) setVoterInfos([]);
                setVoter(e.target.value);
              }}
              value={voter}
            />
            <button disabled={loader} onClick={getVoterInfo}>
              Infos votant
            </button>
            {voterInfos.length > 0 && (
              <div>
                <h2>Enregistré(e): {voterInfos[0] ? "oui" : "non"}</h2>
                <h2>A Voté: {voterInfos[1] ? "oui" : "non"}</h2>
                <h2>
                  Proposition votée:{" "}
                  {voterInfos[1] ? voterInfos[2].toString() : "aucune"}
                </h2>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Header;
