import { useEthContext } from "../context/ethContext";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Loader from "./Loader";

// RegisterVoters component
const RegisterVoters = ({ showToast }) => {

  // Get data from the ethContext
  const {
    getProviderOrSigner,
    getContractInstance,
    workflowStatus,
    account,
    owner,
  } = useEthContext();

  // Define state variables
  const [address, setAddress] = useState("");
  const [loader, setLoader] = useState(false);

  // Helper function to register a voter
  const registerVoter = async (address) => {
    if (loader) return;
    if (workflowStatus !== 0) return;
    // Check if address is a valide Ethereum address
    if (!ethers.utils.isAddress(address)) {
      console.log("adresse invalide");
      showToast("Adresse invalide", true);
      return;
    }
    try {
      setLoader(true);
      const provider = await getProviderOrSigner(true);
       // Get contract instance
      const contractInstance = await getContractInstance(provider);
      // Add voter to contract
      const tx = await contractInstance.addVoter(address);
      showToast("Enregistrement du votant...");
      // listen to contract event
      contractInstance.once("VoterRegistered", (address, event) => {
        console.log("event", event, "address", address);
      });
      // wait for the transaction to be mined
      await tx.wait();
      showToast("Votant enregistré avec succès");
    } catch (err) {
      console.log(err);
      showToast("Erreur, ou votant déjà enregistré", true);
    } finally {
      setLoader(false);
      setAddress("");
    }
  };

  useEffect(() => {
    if (account) {
      showToast("Bienvenue !");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container" style={{ marginTop: "20px" }}>
      {account && account === owner && (
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
              Enregistrement d&apos;un votant
            </h1>
            <input
              type="text"
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse à enregistrer"
              value={address}
            />
            <button disabled={loader} onClick={() => registerVoter(address)}>
              Enregistrer un votant
            </button>
            {loader && <Loader />}
          </div>
        </>
      )}
      {account && account !== owner && (
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
              Vous pourrez bientôt enregistrer vos propositions
              <br />
              lorsque la phase d&apos;enregistrement des votants sera terminée
            </h1>
          </div>
        </>
      )}
    </div>
  );
};

export default RegisterVoters;
