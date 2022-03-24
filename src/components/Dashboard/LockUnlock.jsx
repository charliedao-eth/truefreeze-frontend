import { useMoralis } from "react-moralis";
import { Skeleton } from "antd";
import { useWeb3Contract } from "react-moralis";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <LockUnlock> JSX Elemenet
 */

function LockUnlock(props) {
  const { contract } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { runContractFunction, error, isLoading, contractResponse } =
    useWeb3Contract({
      abi: contract.TrueFreezeGovernor.abi,
      contractAddress: contract.TrueFreezeGovernor.address,
      functionName: "lockWAsset",
      params: {
        _amount: Moralis.Units.ETH(0.01),
        _lockDuration: 2,
      },
    }); // TODO don't hardcode params of course

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
