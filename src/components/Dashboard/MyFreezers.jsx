import { useMoralis } from "react-moralis";
import { Skeleton } from "antd";
import NFTBalance from "components/NFTBalance";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <LockUnlock> JSX Elemenet
 */

function MyFreezers(props) {
  const {contract} = props;
  const { account, isAuthenticated } = useMoralis();
  if (!props.address && (!account || !isAuthenticated)) return <Skeleton />;

  return (
    <div>
      <h3>My Freezers</h3>
      <NFTBalance
        filterByContractAddress={
          contract.nonFungiblePositionManager.address
        }
      />
    </div>
  );
}

export default MyFreezers;
