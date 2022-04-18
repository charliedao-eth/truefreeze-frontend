import { useMoralis } from "react-moralis";
import { Skeleton } from "antd";
import useToken from "hooks/useToken";
import { useState } from "react";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <LockUnlock> JSX Elemenet
 */

function LockUnlock(props) {
  const { contract } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { isInitialized, methods } = useToken({contract});
  const { isWrappedTokenAllowed, allowWrappedToken } = methods;
  const [isLocking, setIsLocking] = useState(false);

  const lockWrappedToken = async (amount, durationInDays) => {
    setIsLocking(true);

    // TODO proper UI input validation. Also pull these values right from the smart contract or embed in the local contract data
    if(!amount || amount.length <= 0) {
      throw new Error("Freezer lock amount is invalid. Cannot lock: " + amount);
    } 
    if(!durationInDays || durationInDays < 10) {
      throw new Error("Freezer lock duration is invalid. Cannot lock for: " + durationInDays + " days");
    }

    try {
      const wrappedTokenAllowedResult = await isWrappedTokenAllowed({ spender: contract.TrueFreezeGovernor.address });
      console.log(wrappedTokenAllowedResult);
      if(!wrappedTokenAllowedResult) {
        const approveWrappedTokenTransaction = await allowWrappedToken({ spender: contract.TrueFreezeGovernor.address });
        const blockchainConfirmation = await approveWrappedTokenTransaction.wait();
        console.log(approveWrappedTokenTransaction);
        console.log(blockchainConfirmation);
      }

      const options = {
        contractAddress: contract.TrueFreezeGovernor.address,
        functionName: "lockWAsset",
        abi: contract.TrueFreezeGovernor.abi,
        params: {
          _amount: amount,
          _lockDuration: durationInDays,
        },
      };
      const freezerTransaction = await Moralis.executeFunction(options);
      console.log(freezerTransaction);

      const freezerConfirmation = await freezerTransaction.wait();
      console.log(freezerConfirmation);

      return freezerConfirmation;
    } catch (err) {
      // TODO user error messaging
      console.error("Freezer locking request failed. ")
      console.error(err);
    } finally {
      setIsLocking(false);
    }
  };

  if (!props.address && (!account || !isAuthenticated)) return <Skeleton />;

  return (
    <div>
      Lock Unlock
      <button onClick={() => lockWrappedToken(Moralis.Units.ETH(0.01), 10)} disabled={isLocking || !isInitialized}>
        Lock 0.01 ETH
      </button>
    </div>
  );
}


export default LockUnlock;
