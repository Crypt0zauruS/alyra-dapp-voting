import { useEthContext } from "../context/ethContext";
import { useState, useEffect } from "react";
import Loader from "./Loader";
import Image from "next/image";

const Vote = ({ showToast }) => {
  const { getProviderOrSigner, getContractInstance, account, workflowStatus } =
    useEthContext();
  const [proposals, setProposals] = useState([]);
  const [proposal, setProposal] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [winning, setWinning] = useState(null);
  const [winningIndex, setWinningIndex] = useState(null);
  const [loader, setLoader] = useState(false);
  const [loaderVote, setLoaderVote] = useState(false);

  const vote = async () => {
    if (loaderVote || loader) return;
    if (workflowStatus !== 3) return;
    if (!authorized) {
      showToast("Vous n'êtes pas un votant", true);
      return;
    }
    if (proposals.length === 0) {
      showToast("Aucune proposition", true);
      return;
    }
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
      const provider = await getProviderOrSigner(true);
      const contractInstance = await getContractInstance(provider);
      const tx = await contractInstance.setVote(proposal);
      showToast("Enregistrement du vote...");
      contractInstance.once("Voted", (from, proposal, event) => {
        console.log("event", event, "from", from, "proposal", proposal);
      });
      await tx.wait();
      showToast("Vote enregistré !");
    } catch (err) {
      console.log(err);
      showToast("Déjà voté ou erreur lors du vote", true);
    } finally {
      setLoaderVote(false);
    }
  };

  const getOneProposal = async (proposalId) => {
    try {
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      const proposalInfo = await contractInstance.getOneProposal(proposalId, {
        from: account,
      });
      return proposalInfo;
    } catch (err) {
      console.error(err);
    }
  };

  const winningProposal = async () => {
    if (workflowStatus < 5) return;
    setLoader(true);
    try {
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      const winningProposal = await contractInstance.getWinningProposalID({
        from: account});
      const winningProposalInfo = await getOneProposal(winningProposal);
      setWinning(winningProposalInfo);
      setWinningIndex(winningProposal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoader(false);
    }
  };

  const getProposals = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      // query all proposals based on event name
      const allProposals = await contractInstance.queryFilter(
        contractInstance.filters.ProposalRegistered()
      );
      const proposalsInfo = await Promise.all(
        allProposals.map(async (proposal) => {
          const proposalInfo = await getOneProposal(proposal.args.proposalId);
          return proposalInfo;
        })
      );
      setProposals(proposalsInfo);
    } catch (err) {
      console.error(err);
    }
  };

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

  const checkIfVoter = async () => {
    try {
      setLoader(true);
      const provider = await getProviderOrSigner();
      const contractInstance = await getContractInstance(provider);
      await contractInstance.getVoter(account, {
        from: account,
      });
      setAuthorized(true);
      await getProposals();
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
