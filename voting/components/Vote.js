import { useEthContext } from "../context/ethContext";
import { useState, useEffect } from "react";
import Loader from "./Loader";
import Image from "next/image";

// Vote component
const Vote = ({ showToast }) => {
  // Get data from the ethContext
  const { getProviderOrSigner, getContractInstance, account, workflowStatus } =
    useEthContext();

  // Define state variables
  const [proposals, setProposals] = useState([]);
  const [proposal, setProposal] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [winning, setWinning] = useState(null);
  const [winningIndex, setWinningIndex] = useState(null);
  const [loader, setLoader] = useState(false);
  const [loaderVote, setLoaderVote] = useState(false);

  // Method to handle voting on a proposal
  const vote = async () => {
    // Check if user is already voting or fetching data
    if (loaderVote || loader) return;
    // Check if voting is allowed at this workflow step
    if (workflowStatus !== 3) return;
    // Check if user is authorized to vote
    if (!authorized) {
      showToast("Vous n'êtes pas un votant", true);
      return;
    }
    // Check if there are any proposals to vote on
    if (proposals.length === 0) {
      showToast("Aucune proposition", true);
      return;
    }
    // Check if selected proposal is valid
    if (
      !/^[0-9]{1,3}$/.test(proposal) ||
      proposal === "" ||
      proposal < 1 ||
      proposal > proposals.length
    ) {
      showToast("proposition invalide", true);
      console.log("proposition invalide");
      return;
    }
    try {
      setLoaderVote(true);
      // Get signer and contract instance
      const provider = await getProviderOrSigner(true);
      const contractInstance = await getContractInstance(provider);
      // Send Vote transaction to the smart contract
      const tx = await contractInstance.setVote(proposal);
      showToast("Enregistrement du vote...");
      // Listen for the 'Voted' event emitted by the smart contract
      contractInstance.once("Voted", (from, proposal, event) => {
        console.log("event", event, "from", from, "proposal", proposal);
      });
      // Wait for the transaction to be mined
      await tx.wait();
      showToast("Vote enregistré !");
    } catch (err) {
      console.log(err);
      showToast("Déjà voté ou erreur lors du vote", true);
    } finally {
      setLoaderVote(false);
    }
  };

  // Method to get information about a single proposal
  const getOneProposal = async (proposalId) => {
    try {
      // Get provider and contract instance
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      // Get the proposal infos from the smart contract
      const proposalInfo = await contractInstance.getOneProposal(proposalId, {
        from: account,
      });
      return proposalInfo;
    } catch (err) {
      console.error(err);
    }
  };

  // This function retrieves the ID of the winning proposal and sets its information in the state variables
  const winningProposal = async () => {
    // Check if the voting session has ended (workflowStatus is 5 or greater)
    if (workflowStatus < 5) return;
    setLoader(true);
    try {
      // Get provider and contract instance
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      // Get the ID of the winning proposal from the smart contract
      const winningProposal = await contractInstance.getWinningProposalID({
        from: account});
      // Get informations of the winning proposal
      const winningProposalInfo = await getOneProposal(winningProposal);
      // Set the winning proposal's information in the state variables
      setWinning(winningProposalInfo);
      setWinningIndex(winningProposal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoader(false);
    }
  };

  // This function retrieves all proposals and sets their information in the state variables
  const getProposals = async () => {
    try {
      // Get provider and contract instance
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      // query all proposals based on event name
      const allProposals = await contractInstance.queryFilter(
        contractInstance.filters.ProposalRegistered()
      );
      // Get the information of each proposal
      const proposalsInfo = await Promise.all(
        allProposals.map(async (proposal) => {
          const proposalInfo = await getOneProposal(proposal.args.proposalId);
          return proposalInfo;
        })
      );
      // Set the proposals' information in the state variables
      setProposals(proposalsInfo);
    } catch (err) {
      console.error(err);
    }
  };

  // This function displays the list of proposals in the UI
  const displayProposals = () => {
    if (!authorized) return;
    if (proposals.length === 0)
      return (
        !loader && (
          <li
            style={{
              color: "red",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Il n&apos;y a pas de propositions
          </li>
        )
      );
    return proposals.map((proposal, index) => {
      // convert big number to number
      if (!proposal) return;
      const votes = proposal?.voteCount.toNumber();
      return (
        <li className="list-group-item" key={index}>
          <p>
            {
              // first character in uppercase
              proposal?.description.charAt(0).toUpperCase() +
                proposal?.description.slice(1)
            }
            {workflowStatus === 5 && <span> 🗳️ Votes: {votes}</span>}
          </p>
        </li>
      );
    });
  };

  // This function checks if the user is authorized to vote
  const checkIfVoter = async () => {
    try {
      setLoader(true);
      // Get provider and contract instance
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      // Get Voter Informations
      await contractInstance.getVoter(account, {
        from: account,
      });
      // Set authorized to true and get proposals
      setAuthorized(true);
      await getProposals();

      // Show toast message depending on workflow status
      if (workflowStatus === 3) {
        showToast("Bienvenue à la session de vote !");
      } else if (workflowStatus === 4) {
        showToast("Les votes sont terminés !");
      } else if (workflowStatus === 5) {
        showToast("Le décompte a été effectué !");
      }
    } catch (err) {
      console.log(err);
      setProposals([]);
      setAuthorized(false);
      showToast("Vous n'êtes pas un votant", true);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    checkIfVoter();
    winningProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, workflowStatus]);

  return (
    <div className="post-section">
      <div className="card mb-3">
        <Image
          src="/Vote.png"
          width="408"
          height="355"
          className="card-img-top img-fluid"
          alt="vote picture"
        />
        {loaderVote && <Loader />}

        <div className="card-body">
          {account &&
            authorized &&
            workflowStatus >= 3 &&
            workflowStatus <= 4 && (
              <>
                {!loader ? (
                  <>
                    {proposals.length > 0 ? (
                      <div>
                        <h5 className="card-title">
                          Propositions: {proposals.length} <br />
                          {workflowStatus === 3
                            ? "Entrer le numéro d'une proposition:"
                            : "Les votes sont terminés"}
                        </h5>
                        <input
                          type="number"
                          min={1}
                          max={proposals.length}
                          onChange={(e) => setProposal(e.target.value)}
                        />
                        <button
                          disabled={
                            workflowStatus !== 3 || loaderVote || loader
                          }
                          onClick={vote}
                          style={{
                            fontSize: "1.4rem",
                          }}
                        >
                          {workflowStatus === 3
                            ? "Voter !"
                            : "Session terminée"}
                        </button>
                      </div>
                    ) : (
                      <h5 className="card-title">
                        Aucune proposition de faite
                      </h5>
                    )}
                  </>
                ) : (
                  <Loader />
                )}
              </>
            )}
          {account && authorized && workflowStatus >= 5 && (
            <>
              <h5 className="card-title">La session de vote est terminée</h5>
              {!loader ? (
                <div>
                  <p className="card-text">Proposition gagnante: </p>
                  <p
                    className="card-text text-center"
                    style={{
                      color: "red",
                      backgroundColor: "black",
                      padding: "10px",
                      margin: "auto",
                      width: "80%",
                      borderRadius: "50px",
                      boxShadow: "0 0 10px 0 black",
                    }}
                  >
                    {winningIndex > 0
                      ? "Numéro " +
                        winningIndex +
                        " - " +
                        // first character in uppercase
                        winning?.description.charAt(0).toUpperCase() +
                        winning?.description.slice(1) +
                        " - avec 🗳️  " +
                        winning?.voteCount.toNumber() +
                        " votes"
                      : proposals.length === 0
                      ? "Aucune proposition n'a été enregistrée"
                      : "Aucune proposition n'a été votée"}
                  </p>
                </div>
              ) : (
                <Loader />
              )}
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
          <div id="proposals">
            <ol className="list-group list-group-numbered">
              {displayProposals()}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vote;
