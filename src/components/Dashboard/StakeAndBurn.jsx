import { useState } from "react";
import { useMoralis } from "react-moralis";
import { Button, Skeleton, Tabs } from "antd";
import useToken from "hooks/useToken";

const { TabPane } = Tabs;

function StakeAndBurn(props) {
  const { contract } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { isInitialized, methods } = useToken({ contract });
  const {
    checkThenAllowFrToken,
    checkThenAllowFrz,
  } = methods;
  const [isTransacting, setIsTransacting] = useState(false);

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

  return (
    <div>
      {/* TODO split this into tabs */}
      <Tabs defaultActiveKey="1" centered>
        <TabPane tab="Burn" key="1">
          <Burn />
        </TabPane>
        <TabPane tab="Stake" key="2">
          <Stake />
        </TabPane>
        <TabPane tab="Rewards" key="3">
          <ClaimRewards />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default StakeAndBurn;
