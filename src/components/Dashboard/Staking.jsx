import { useMoralis } from "react-moralis";
import { Skeleton } from "antd";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Staking> JSX Elemenet
 */

function Staking(props) {
  const { account, isAuthenticated } = useMoralis();
  if (!props.address && (!account || !isAuthenticated)) return <Skeleton />;

  return <div>Staking todo</div>;
}

export default Staking;
