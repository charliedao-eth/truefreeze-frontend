import { useEffect, useState, Fragment } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { Skeleton } from "antd";
import LockUnlock from "./LockUnlock";
import MyFreezers from "./MyFreezers";
import Staking from "./Staking";
import rinkebyContracts from "contracts/contractInfo";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Dashboard> JSX Elemenet
 */

function Dashboard(props) {
  const { account, isAuthenticated } = useMoralis();
  if (!props.address && (!account || !isAuthenticated)) return <Skeleton />;

  return (
    <div>
      {/* TODO Split each view below into their own routes */}
      <DashboardData account={account} />
      <hr />
      <LockUnlock />
      <hr />
      <MyFreezers />
      <hr />
      <Staking />
    </div>
  );
}

function DashboardData({ account }) {
  // TODO create generic helpers for fetching data to separate UI from logic
  const [frTokenTotalSupply, setFrTokenTotalSupply] = useState(""); // keep BigNumbers as strings in javascript to avoid rounding errors due to differences between JS and ethereum
  const [frTokenAllowance, setFrTokenAllowance] = useState("");
  const [frTokenBalance, setFrTokenBalance] = useState("");
  const [frzTotalSupply, setFrzTotalSupply] = useState("");
  const [frzAllowance, setFrzAllowance] = useState("");
  const [frzBalance, setFrzBalance] = useState("");

  // TODO reduce boilerplate below with abstraction
  const {
    runContractFunction: getFrTokenTotalSupply,
    error: getFrTokenTotalSupplyError,
  } = useWeb3Contract({
    abi: rinkebyContracts.frToken.abi,
    contractAddress: rinkebyContracts.frToken.address,
    functionName: "totalSupply",
  });
  const {
    runContractFunction: getFrTokenAllowance,
    error: getFrTokenAllowanceError,
  } = useWeb3Contract({
    abi: rinkebyContracts.frToken.abi,
    contractAddress: rinkebyContracts.frToken.address,
    functionName: "allowance",
    params: {
      owner: account,
      spender: rinkebyContracts.TrueFreezeGovernor.address,
    },
  });
  const {
    runContractFunction: getFrTokenBalance,
    error: getFrTokenBalanceError,
  } = useWeb3Contract({
    abi: rinkebyContracts.frToken.abi,
    contractAddress: rinkebyContracts.frToken.address,
    functionName: "balanceOf",
    params: {
      account: account,
    },
  });

  const {
    runContractFunction: getFrzTotalSupply,
    error: getFrzTotalSupplyError,
  } = useWeb3Contract({
    abi: rinkebyContracts.FRZ.abi,
    contractAddress: rinkebyContracts.FRZ.address,
    functionName: "totalSupply",
  });
  const { runContractFunction: getFrzAllowance, error: getFrzAllowanceError } =
    useWeb3Contract({
      abi: rinkebyContracts.FRZ.abi,
      contractAddress: rinkebyContracts.FRZ.address,
      functionName: "allowance",
      params: {
        owner: account,
        spender: rinkebyContracts.TrueFreezeGovernor.address,
      },
    });
  const { runContractFunction: getFrzBalance, error: getFrzBalanceError } =
    useWeb3Contract({
      abi: rinkebyContracts.FRZ.abi,
      contractAddress: rinkebyContracts.FRZ.address,
      functionName: "balanceOf",
      params: {
        account: account,
      },
    });

  useEffect(() => {
    (async () => {
      // TODO performance optimization: don't synchronously await each call. wait for all with Promise.all instead
      const frTokenTotalSupplyResults = await getFrTokenTotalSupply(); // TODO generic error handling for contract read and write methods
      const frTokenAllowanceResults = await getFrTokenAllowance();
      const frTokenBalanceResults = await getFrTokenBalance();

      const frzTotalSupplyResults = await getFrzTotalSupply(); // TODO generic error handling for contract read and write methods
      const frzAllowanceResults = await getFrzAllowance();
      const frzBalanceResults = await getFrzBalance();

      setFrTokenTotalSupply(
        frTokenTotalSupplyResults?.toString() || "Failed to load",
      );
      setFrTokenAllowance(
        frTokenAllowanceResults?.toString() || "Failed to load",
      );
      setFrTokenBalance(frTokenBalanceResults?.toString() || "Failed to load");

      setFrzTotalSupply(frzTotalSupplyResults?.toString() || "Failed to load");
      setFrzAllowance(frzAllowanceResults?.toString() || "Failed to load");
      setFrzBalance(frzBalanceResults?.toString() || "Failed to load");
    })();
  }, [getFrTokenTotalSupply]); // this will run only one time

  return (
    <Fragment>
      Total frToken supply: {frTokenTotalSupply}
      <br />
      Your frToken allowance: {frTokenAllowance}
      <br />
      Your frToken balance: {frTokenBalance}
      <br />
      Total FRZ supply: {frzTotalSupply}
      <br />
      Your FRZ allowance: {frzAllowance}
      <br />
      Your FRZ balance: {frzBalance}
      <br />
      {getFrTokenTotalSupplyError &&
        JSON.stringify(getFrTokenTotalSupplyError)}{" "}
      {/* TODO real error handling */}
      {getFrTokenAllowanceError && JSON.stringify(getFrTokenAllowanceError)}
      {getFrTokenBalanceError && JSON.stringify(getFrTokenBalanceError)}
      {getFrzTotalSupplyError && JSON.stringify(getFrzTotalSupplyError)}
      {getFrzAllowanceError && JSON.stringify(getFrzAllowanceError)}
      {getFrzBalanceError && JSON.stringify(getFrzBalanceError)}
    </Fragment>
  );
}

export default Dashboard;
