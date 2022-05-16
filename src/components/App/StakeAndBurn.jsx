import { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { Button, Skeleton, Tabs } from "antd";
import useToken from "hooks/useToken";

const { TabPane } = Tabs;

function StakeAndBurn(props) {
  const { contract } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { isInitialized, methods } = useToken({ contract });
  const { checkThenAllowFrToken, checkThenAllowFrz } = methods;
  const [isTransacting, setIsTransacting] = useState(false);

  useEffect(() => changeBg("burn"), []); // trigger the bg change to the default special gradient

  if (!isInitialized || (!props.address && (!account || !isAuthenticated)))
    return <Skeleton />;

  const genericAmountTransaction = async ({
    contractName,
    functionName,
    approvals = [],
    amount,
  }) => {
    if (!amount) {
      throw new Error(`${amount} is not a valid amount.`);
    }

    return genericTransaction({
      contractName,
      functionName,
      approvals,
      params: { amount },
    });
  };

  const genericTransaction = async ({
    contractName,
    functionName,
    approvals = [],
    params,
  }) => {
    setIsTransacting(true);
    try {
      await Promise.all(
        approvals.map(
          (approvalFunction) =>
            approvalFunction({ spender: contract[contractName].address }), // spender is assumed to be the contract we're interacting with
        ),
      );
      let options = {
        contractAddress: contract[contractName].address,
        functionName: functionName,
        abi: contract[contractName].abi,
      };
      if (params) {
        options.params = { ...params };
      }
      const transaction = await Moralis.executeFunction(options);
      const confirmation = await transaction.wait();
      return confirmation;
    } finally {
      setIsTransacting(false);
    }
  };

  const burnFrToken = async (amount) =>
    await genericAmountTransaction({
      contractName: "frTokenStaking",
      functionName: "stake",
      approvals: [checkThenAllowFrToken],
      amount,
    });
  const stakeFrz = async (amount) =>
    await genericAmountTransaction({
      contractName: "MultiRewards",
      functionName: "stake",
      approvals: [checkThenAllowFrz],
      amount,
    });
  const withdrawFrz = async (amount) =>
    await genericAmountTransaction({
      contractName: "MultiRewards",
      functionName: "withdraw",
      amount,
    });
  const claimAllRewards = async () =>
    await genericTransaction({
      contractName: "MultiRewards",
      functionName: "getReward",
    });

  function Burn() {
    return (
      <div>
        {/* TODO Un-hardcode the burn amount */}
        <Button loading={isTransacting} onClick={() => burnFrToken(100)}>
          burn frToken
        </Button>
      </div>
    );
  }
  function Stake() {
    return (
      <div>
        {/* TODO Un-hardcode the stake amounts */}
        <Button loading={isTransacting} onClick={() => stakeFrz(100)}>
          stake FRZ
        </Button>
        <Button loading={isTransacting} onClick={() => withdrawFrz(100)}>
          withdraw FRZ
        </Button>
      </div>
    );
  }
  function ClaimRewards() {
    return (
      <div>
        <Button loading={isTransacting} onClick={claimAllRewards}>
          claim all
        </Button>
      </div>
    );
  }

  function changeBg(selectedTabKey) {
    document
      .querySelector(".gradient-bg")
      ?.classList.remove(
        "gradient-bg-red",
        "gradient-bg-green",
        "gradient-bg-blue",
      );

    if (selectedTabKey === "burn") {
      document.querySelector(".gradient-bg")?.classList.add("gradient-bg-red");
    } else if (selectedTabKey === "rewards") {
      document
        .querySelector(".gradient-bg")
        ?.classList.add("gradient-bg-green");
    } else {
      document.querySelector(".gradient-bg")?.classList.add("gradient-bg-blue");
    }
  }

  return (
    <div className="appPageContent stakeandburn">
      <section className="page-toolbar white-text m-b-1">
        <div className="wallet-info">
          <div>
            <b>WALLET</b>
          </div>
          <div>
            0x...{account?.substring(account?.length - 4, account?.length)}
          </div>
        </div>
        <div className="curriencies inline-flex flex-align--right">
          <div className="frToken-holdings m-r-1">
            <div>
              <b>frETH</b>
            </div>
            <div className="notReady">000.00</div>
          </div>
          <div className="frz-holdings">
            <div>
              <b>FRZ</b>
            </div>
            <div className="notReady">00.00</div>
          </div>
        </div>
      </section>
      <Tabs defaultActiveKey="burn" centered onChange={changeBg}>
        <TabPane tab="BURN" key="burn">
          <Burn />
        </TabPane>
        <TabPane tab="STAKE" key="stake">
          <Stake />
        </TabPane>
        <TabPane tab="REWARDS" key="rewards">
          <ClaimRewards />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default StakeAndBurn;
