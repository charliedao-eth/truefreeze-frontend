import { Fragment, useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import { Skeleton } from "antd";
import useToken from "hooks/useToken";
import LockUnlock from "./LockUnlock";
import MyFreezers from "./MyFreezers";
import Staking from "./Staking";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Dashboard> JSX Elemenet
 */

function Dashboard(props) {
  const { account, isAuthenticated } = useMoralis();
  const { contract } = props;
  if (!contract || (!props.address && (!account || !isAuthenticated)))
    return <Skeleton />;

  return (
    <div>
      {/* TODO Split each view below into their own routes */}
      <DashboardData account={account} contract={contract} />
      <hr />
      <LockUnlock contract={contract} />
      <hr />
      <MyFreezers contract={contract} />
      <hr />
      <Staking contract={contract} />
    </div>
  );
}

function DashboardData({ contract }) {
  const { isInitialized, tokenData, errors, methods, } = useToken({
    contract,
  });
  const {
    frTokenTotalSupply,
    frTokenBalance,
    frzTotalSupply,
    frzBalance,
  } = tokenData;

  const { isFrTokenAllowed } = methods;

  const [temp, setTemp] = useState("");

  useEffect(() => {
    if (isInitialized) {
      (async () => {
        const result = await isFrTokenAllowed({ spender: contract.frTokenStaking.address });
        setTemp(result + "");
      })();
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return <Skeleton />;
  }

  

  

  // TODO \/ we can remove this var and the output after development is completely
  const allErrors = Object.keys(errors).map((errorKey) => [
    errorKey,
    errors[errorKey],
  ]);


  return (
    <Fragment>
      Total frToken supply: {frTokenTotalSupply}
      <br />
      Your frToken balance: {frTokenBalance}
      <br />
      Total FRZ supply: {frzTotalSupply}
      <br />
      Your FRZ balance: {frzBalance}
      <br />
      Is frTokenApproved? {temp}
      <ol>
        Errors:{" "}
        {allErrors.map(([errorLocation, errorValue]) => (
          <li>
            {errorLocation}: {errorValue || "OK"}
          </li>
        ))}
      </ol>
    </Fragment>
  );
}

export default Dashboard;
