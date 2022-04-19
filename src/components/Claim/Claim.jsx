import { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { Button, Skeleton } from "antd";
import { users } from "../../contracts/merkle";

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
      if (contract && account && userClaimData) {
        const claimResult = await checkIfClaimed();
        console.log('Account freeze already claimed:');
        console.log(claimResult);
        setAlreadyClaimed(claimResult);
      }
    })();
  }, [account]);

  if (!contract || !props.address && (!account || !isAuthenticated)) return <Skeleton />;



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
    if(!userClaimData) {
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
    } catch(err) {
      console.error("Failed to claim FRZ:");
      console.error(err);
    } finally {
      setIsClaiming(false);
    }
  }
  
  const renderNoClaim = () => (
    <h2>No claim found for your address.</h2>
  );

  const renderAlreadyClaimed = () => (
    <h2>This address has already claimed {`${userClaimData?.amount} `}FRZ</h2>
  );

  if (!userClaimData) {
    return renderNoClaim();
  } else if(alreadyClaimed === true) {
    return renderAlreadyClaimed();
  }

  return (
    <div>
      <h2>Good news. This address has {`${userClaimData?.amount} `}FRZ available to claim!</h2>
      <Button loading={isClaiming} onClick={claim}>Claim</Button>
    </div>
  );
}

function getUserInClaimList(address) {
  if(!address) {
    return undefined;
  }
  return users.find((item) => item.address.toLowerCase() === address.toString().toLowerCase());
}

export default Claim;
