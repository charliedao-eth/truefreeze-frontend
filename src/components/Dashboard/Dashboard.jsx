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
  const { isInitialized, tokenData, errors, methods } = useToken({
    contract,
  });
  const { frTokenTotalSupply, frTokenBalance, frzTotalSupply, frzBalance } =
    tokenData;

  const { isFrTokenAllowed, isFrzAllowed, isWrappedTokenAllowed } = methods;

  const [temp, setTemp] = useState([false, false, false]); // TODO remove. used to debug token state

  useEffect(() => {
    // TODO remove. used to debug token state
    if (isInitialized) {
      (async () => {
        let frFresult = await isFrTokenAllowed({
          spender: "0x8cFBE91Da3a4636b8D0D5aB2b1eB55785A5B3a68",
        });
        let frzFresult = await isFrzAllowed({
          spender: "0x8cFBE91Da3a4636b8D0D5aB2b1eB55785A5B3a68",
        });
        let wethResult = await isWrappedTokenAllowed({
          spender: "0x8cFBE91Da3a4636b8D0D5aB2b1eB55785A5B3a68",
        });
        setTemp([frFresult, frzFresult, wethResult]);
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
      Is frToken approved? {temp[0] + ""}
      <br />
      Is FRZ approved? {temp[1] + ""}
      <br />
      Is wrapped asset approved? {temp[2] + ""}
      <br />
      <ol>
        Errors:{" "}
        {allErrors.map(([errorLocation, errorValue], index) => (
          <li key={index + "-dashboard-err"}>
            {errorLocation}: {errorValue || "OK"}
          </li>
        ))}
      </ol>
    </Fragment>
  );
}

export default Dashboard;
