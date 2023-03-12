import { useEthContext } from "../context/ethContext";
import { ToastContainer, toast } from "react-toastify";
import RegisterVoters from "../components/RegisterVoters";
import RegisterProposals from "../components/RegisterProposals";
import Vote from "../components/Vote";

export default function Home() {
  const { workflowStatus, account } = useEthContext();

  const showToast = (message, type = false) => {
    if (!type) {
      toast.success(message, { closeOnClick: true, pauseOnHover: false });
    } else {
      toast.error(message, { closeOnClick: true, pauseOnHover: false });
    }
  };

  return (
    <div>
      <ToastContainer />
      {account ? (
        <>
          {workflowStatus === 0 && <RegisterVoters showToast={showToast} />}
          {workflowStatus === 1 || workflowStatus === 2 ? (
            <RegisterProposals showToast={showToast} />
          ) : null}

          {workflowStatus > 2 && workflowStatus <= 5 && (
            <Vote showToast={showToast} />
          )}
        </>
      ) : (
        <h1
          className="text-center"
          style={{ color: "lightgray", marginTop: "20px" }}
        >
          Veuillez connecter votre Wallet
        </h1>
      )}
    </div>
  );
}
