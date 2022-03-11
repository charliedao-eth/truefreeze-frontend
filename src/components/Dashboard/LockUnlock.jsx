import { useMoralis } from "react-moralis";
import { Skeleton } from "antd";
import { useWeb3Contract } from "react-moralis";
import rinkebyContracts from "contracts/contractInfo";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <LockUnlock> JSX Elemenet
 */

function LockUnlock(props) {
  const { account, isAuthenticated } = useMoralis();
  const { runContractFunction, error, isLoading, contractResponse } =
    useWeb3Contract({
      abi: rinkebyContracts.TrueFreezeGovernor.abi,
      address: rinkebyContracts.TrueFreezeGovernor.address,
      functionName: "lockWAsset",
      params: {
        _amount: 10000000000000000,
        _lockDuration: 1,
      },
    });

  if (!props.address && (!account || !isAuthenticated)) return <Skeleton />;

  return (
    <div>
      Lock Unlock
      {error ? error.toString() : null}
      <button onClick={() => runContractFunction()} disabled={isLoading}>
        Lock 0.01 ETH
      </button>
      <pre>{contractResponse && JSON.stringify(contractResponse)}</pre>
    </div>
  );
}

export default LockUnlock;
