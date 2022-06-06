import { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { Button, Skeleton } from "antd";
import { users } from "../../contracts/merkle";
import claimImage from "../../assets/claim_image.png";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Staking> JSX Elemenet
 */

function Claim(props) {
  const { contract } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const [alreadyClaimed, setAlreadyClaimed] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const userClaimData = getUserInClaimList(account);

  useEffect(() => {
    (async () => {
      if (userClaimData === false) {
        setAlreadyClaimed(true);
      } else if (contract && account && userClaimData) {
        const claimResult = await checkIfClaimed();
        console.log("Account freeze already claimed:");
        console.log(claimResult);
        setAlreadyClaimed(claimResult);
      }
    })();
  }, [account]);

  if (alreadyClaimed === null || !contract || !account || !isAuthenticated) {
    return (
      <div className="appPageContent">
        <div className="page-skeleton-wrapper slow-show">
          <Skeleton />;
        </div>
      </div>
    );
  }

  async function checkIfClaimed() {
    const options = {
      contractAddress: contract.merkleTree.address,
      functionName: "isClaimed",
      abi: contract.merkleTree.abi,
      params: {
        index: userClaimData?.index,
      },
    };

    return await Moralis.executeFunction(options);
  }
  async function claim() {
    if (!userClaimData) {
      console.error("Tried to claim with missing userClaimData. Cannot claim.");
      return false;
    }
    const options = {
      contractAddress: contract.merkleTree.address,
      functionName: "claim",
      abi: contract.merkleTree.abi,
      params: {
        index: userClaimData?.index,
        account: userClaimData?.address,
        amount: userClaimData?.amount,
        merkleProof: userClaimData?.merkleProof,
      },
    };

    setIsClaiming(true);
    let claimTranaction;
    try {
      claimTranaction = await Moralis.executeFunction(options); // resolves when transaction sent (i.e. approve/reject pressed)
      await claimTranaction.wait(); // resolves when blockchain confirmed (at least 1)
      window.location.reload(); // TODO do a "SUCCESS! FRZ claimed! state instead"
    } catch (err) {
      console.error("Failed to claim FRZ:");
      console.error(err);
    } finally {
      setIsClaiming(false);
    }
  }

  const renderNoClaim = () => (
    <div className="claim-page">
      <h2 className="claim-subtitle">No claim found for your address.</h2>
    </div>
  );

  const renderAlreadyClaimed = () => (
    <div className="claim-page">
      <h2 className="claim-subtitle">This address has already claimed {`${userClaimData?.amount && displayFormatAmount(userClaimData.amount)} `}FRZ</h2>
    </div>
  );

  if (!userClaimData) {
    return renderNoClaim();
  } else if (alreadyClaimed === true) {
    return renderAlreadyClaimed();
  }

  function displayFormatAmount(tokenAmountInWei) {
    return (Number(Moralis.Units.FromWei(tokenAmountInWei))?.toFixed(2) / 1) || "--";
  }

  return (
    <div className="claim-page">
      <img className="claim-image" src={claimImage} />
      <h2 className="claim-subtitle">This address has {`${userClaimData?.amount && displayFormatAmount(userClaimData.amount)} `}FRZ available to claim!</h2>
      <Button className="claim-button" type="primary" size="large" loading={isClaiming} onClick={claim}>
        Claim
      </Button>
    </div>
  );
}

/**
 *
 * @param {String} address
 * @returns null for error or bad inputs. false if the user is not in the claim list. Object otherwise.
 */
function getUserInClaimList(address) {
  if (!address) {
    return null;
  }
  return users.find((item) => item.address.toLowerCase() === address.toString().toLowerCase()) || false; // distinguish a false return from null (false means it aint there)
}

export default Claim;
