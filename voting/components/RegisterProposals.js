import { useEthContext } from "../context/ethContext";
import { useState, useEffect } from "react";
import Loader from "./Loader";

// Component to register proposals
const RegisterProposals = ({ showToast }) => {

  //Extract necessary values from the ethContext
  const { getProviderOrSigner, getContractInstance, account, workflowStatus } =
    useEthContext();

  // Define the state variables
  const [proposal, setProposal] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loader, setLoader] = useState(false);

  // Function to check if the current account is authorized to make a proposal
  const checkIfVoter = async () => {
    try {
      // Get provider and contract instance
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      // Get Voter Informations for current user from smart contract
      await contractInstance.getVoter(account, {
        from: account,
      });
      setAuthorized(true);
      if (workflowStatus === 1) {
        showToast("Vous pouvez faire une proposition");
      } else if (workflowStatus === 2) {
        showToast("Enregistrement des propositions terminé");
      }
    } catch (err) {
      console.log(err);
      setAuthorized(false);
    }
  };
  // Helper function to register a proposal
  const registerProposal = async (proposalDescription) => {
    if (loader) return;
    if (workflowStatus !== 1) return;
    if (!authorized) {
      showToast("Vous n'êtes pas un votant", true);
      return;
    }
    // Check if proposalDescription is a string and if it is between 10 and 100 characters
    if (
      !/^[0-9a-zA-ZÀ-ÿ\s,'-.!?]{10,100}$/.test(proposalDescription) ||
      proposalDescription === ""
    ) {
      console.log("proposition invalide");
      showToast("proposition invalide", true);
      return;
    }
    try {
      setLoader(true);
      // Get signer and contract instance
      const provider = await getProviderOrSigner(true);
      const contractInstance = await getContractInstance(provider);
      // Send addProposal transaction to the smart contract
      const tx = await contractInstance.addProposal(proposalDescription);
      showToast("Enregistrement de la proposition...");
      // Listen to the event emitted by the contract
      contractInstance.once("ProposalRegistered", (proposal, event) => {
        console.log("event", event, "proposal", proposal);
      });
      // Wait for the transaction to be mined
      await tx.wait();
      showToast("Proposition enregistrée");
    } catch (err) {
      console.log(err);
      showToast("Erreur lors de l'enregistrement de la proposition", true);
    } finally {
      setLoader(false);
      setProposal("");
    }
  };

  // Call checkIfVoter() when account or workflowStatus changes
  useEffect(() => {
    checkIfVoter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, workflowStatus]);

  return (
    <div className="container" style={{ marginTop: "20px" }}>
      {account && authorized && workflowStatus >= 1 && workflowStatus <= 2 && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <h1 className="text-center" style={{ color: "lightgray" }}>
              {workflowStatus === 1
                ? "Enregistrement d'une proposition"
                : "Enregistrement des propositions terminé"}
            </h1>
            <input
              type="text"
              placeholder="proposition, au moins 10 caractères"
              title="lettres, chiffres, ' - . ! , ? et espaces uniquement"
              onChange={(e) => setProposal(e.target.value)}
              value={proposal}
              disabled={workflowStatus !== 1 || loader}
            />
            <button
              disabled={workflowStatus !== 1 || loader}
              onClick={() => registerProposal(proposal)}
            >
              {workflowStatus !== 1
                ? "Enregistrement terminé"
                : "Faire une proposition"}
            </button>
            {loader && <Loader />}
          </div>
        </>
      )}
      {account && !authorized && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <h1 className="text-center" style={{ color: "lightgray" }}>
              Vous n&apos;êtes pas un votant 😢
            </h1>
          </div>
        </>
      )}
    </div>
  );
};

export default RegisterProposals;
