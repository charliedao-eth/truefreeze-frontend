import { useState, useEffect, Fragment } from "react";
import { useMoralis } from "react-moralis";
import { Button, Tabs } from "antd";
import CustomNumberInput from "./CustomNumberInput";
import burnIcon from "../../assets/burnicon.svg";
import lockIcon from "../../assets/lockicon.svg";
import frethIcon from "../../assets/frethicon.svg";
import frzIcon from "../../assets/frzicon.svg";
import ethIcon from "../../assets/ethicon.svg";
import circleIcon from "../../assets/circleicon.svg";
import PageToolbar from "./PageToolbar";
import { Loading3QuartersOutlined } from "@ant-design/icons";

const { TabPane } = Tabs;

function StakeAndBurn(props) {
  const { contract, tokens } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { isInitialized, methods, tokenData } = tokens;
  const { frTokenBurnt, frTokenTotalBurnt, frzFlowShare, frzStaked, frzTotalStaked, rewardTokens, tokenMetadata } = tokenData;
  const { checkThenAllowFrToken, checkThenAllowFrz, refreshTokenData } = methods;
  const frTokenSymbol = tokenMetadata?.frToken?.symbol || "frToken";
  const frzSymbol = tokenMetadata?.FRZ?.symbol || "{frzSymbol}";
  const wrappedSymbol = tokenMetadata?.wrappedToken?.symbol || "wrapped";
  const [isTransacting, setIsTransacting] = useState(false);

  useEffect(() => changeBg("burn"), []); // trigger the bg change to the default special gradient

  if (!isInitialized || (!props.address && (!account || !isAuthenticated))) {
    return <div className="appPageContent" />;
  }

  const genericAmountTransaction = async ({ contractName, functionName, approvals = [], amount }) => {
    amount = Moralis.Units.Token(amount);
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

  const genericTransaction = async ({ contractName, functionName, approvals = [], params }) => {
    setIsTransacting(true);
    try {
      await Promise.all(
        approvals.map(
          (approvalFunction) => approvalFunction({ spender: contract[contractName].address }), // spender is assumed to be the contract we're interacting with
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
      refreshTokenData();
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

  const burnButton = ({ amount: burnAmount }) => {
    return (
      <Button className="uhoh" loading={isTransacting} onClick={() => burnFrToken(burnAmount)}>
        BURN {frTokenSymbol}
      </Button>
    );
  };
  const stakeButton = ({ amount: stakeAmount }) => {
    return (
      <Button type="primary" loading={isTransacting} onClick={() => stakeFrz(stakeAmount)}>
        STAKE {frzSymbol}
      </Button>
    );
  };
  const unstakeButton = ({ amount: unstakeAmount }) => {
    return (
      <Button type="primary" loading={isTransacting} onClick={() => withdrawFrz(unstakeAmount)}>
        UNSTAKE {frzSymbol}
      </Button>
    );
  };

  function Burn() {
    return (
      <div>
        <div className="text-align-center white-text">
          <div>
            Burn {frTokenSymbol} to earn {frzSymbol}. <b>Burnt {frTokenSymbol} is gone forever.</b>
          </div>
          <div>In exchange, you earn a flow of {frzSymbol}.</div>
          <div>Staked {frzSymbol} will earn you a portion of early withdrawal fees paid by other users.</div>
        </div>
        <div className="flex justify-center m-t-2">
          <section className="translucent-card flex-half m-r-2">
            <img src={burnIcon} className="card-icon" />
            <h3 className="card-title">BURN</h3>
            <CurrencyAmountAction label="AMOUNT" ActionButton={burnButton} />
            <div>
              <div className="choke-label">EARN</div>
              <div>
                <span className="font-35">{frzSymbol}</span>
                <span>&nbsp;flow forever</span>
              </div>
            </div>
          </section>
          <section className="transparent-card flex-half">
            <div>
              <div>
                <span className="font-35">{frTokenBurnt ? parseFloat(frTokenBurnt)?.toFixed(2) : "--"}</span>
                <span className="p-l-1">{frTokenSymbol}</span>
              </div>
              <div>Your Burnt</div>
            </div>
            <div>
              <div>
                <span className="font-35">{frTokenTotalBurnt ? parseFloat(frTokenTotalBurnt)?.toFixed(2) : "--"}</span>
                <span className="p-l-1">{frTokenSymbol}</span>
              </div>
              <div>Total Burnt</div>
            </div>
            <div>
              <div>
                <span className="font-35">{frzFlowShare ? frzFlowShare + "%" : "--"}</span>
                <span className="p-l-1"></span>
              </div>
              <div>{frzSymbol} Flow Share</div>
            </div>
          </section>
        </div>
      </div>
    );
  }
  function Stake() {
    return (
      <div>
        <div className="text-align-center white-text p-r-2 p-l-2">
          <div>
            By staking your {frzSymbol}, you will earn a portion of penalties paid by other users. These penalties are paid in {frTokenSymbol} and {wrappedSymbol} and can be
            claimed on the 'REWARDS' tab.
          </div>
        </div>
        <div className="flex justify-center m-t-2">
          <section className="translucent-card taller flex-half m-r-2">
            <img src={lockIcon} className="card-icon" />
            <h3 className="card-title">STAKE</h3>
            <CurrencyAmountAction label="AMOUNT" ActionButton={stakeButton} />
            <h3 className="card-title m-t-1">UNSTAKE</h3>
            <CurrencyAmountAction label="AMOUNT" ActionButton={unstakeButton} />
          </section>
          <section className="transparent-card taller flex-half two-value-card">
            <div>
              <div>
                <span className="font-35">{frzStaked ? parseFloat(frzStaked)?.toFixed(2) : "--"}</span>
                <span className="p-l-1">{frzSymbol}</span>
              </div>
              <div>Your Staked</div>
            </div>
            <div>
              <div>
                <span className="font-35">{frzTotalStaked ? parseFloat(frzTotalStaked)?.toFixed(2) : "--"}</span>
                <span className="p-l-1">{frzSymbol}</span>
              </div>
              <div>Total Staked</div>
            </div>
            {/* penalty data is not simple to retrieve at this time
            <div>
              <div>
                <span className="font-35 notReady">1,232</span>
              </div>
              <div>{frTokenSymbol} Penalties Paid</div>
            </div>
            <div>
              <div>
                <span className="font-35 notReady">1,232</span>
                <span className="p-l-1"></span>
              </div>
              <div>{wrappedSymbol} Penalties Paid</div>
            </div>
            */}
          </section>
        </div>
      </div>
    );
  }
  function ClaimRewards() {
    function formatRewardAmount(lookupSymbol) {
      // TODO rewardTokens really should be a map, not an array, so we can avoid lookups like this
      if(!rewardTokens) {
        return <Loading3QuartersOutlined />;
      }

      const rewardAmount = Number(rewardTokens?.find((token) => token.symbol === lookupSymbol)?.amount);
      if (rewardAmount !== 0 && !rewardAmount) {
        return "ERROR"
      }
      if(rewardAmount > 0 && rewardAmount < 0.0001) {
        return rewardAmount?.toExponential(1);
      }

      const formattedAmount = rewardAmount?.toFixed(3) / 1;
      return formattedAmount;
    }

    return (
      <Fragment>
        <div className="text-align-center white-text p-r-2 p-l-2">
          <div>Claim the fees you've earned from staking your {frzSymbol}. Claim each token individually or all at once.</div>
        </div>
        <div className="flex justify-center claim-tab m-t-2">
          <div className="transparent-card wide taller flex flex-column center">
            <div className="claim-row">
              <div className="transparent-card small">
                <div className="claim-currency font-35 nowrap">{frTokenSymbol}</div>
                <img src={frethIcon} className="card-icon" />
                <div>
                  <span className="font-35 nowrap">{formatRewardAmount(frTokenSymbol)}</span>
                  <span className="p-l-1">{frTokenSymbol}</span>
                </div>
              </div>
            </div>
            <div className="claim-row">
              <div className="transparent-card small">
                <div className="claim-currency font-35 nowrap">{frzSymbol}</div>
                <img src={frzIcon} className="card-icon" />
                <div>
                  <span className="font-35 nowrap">{formatRewardAmount(frzSymbol)}</span>
                  <span className="p-l-1">{frzSymbol}</span>
                </div>
              </div>
            </div>
            <div className="claim-row">
              <div className="transparent-card small">
                <div className="claim-currency font-35 nowrap">{wrappedSymbol}</div>
                <img src={ethIcon} className="card-icon eth-icon" />
                <img src={circleIcon} className="card-icon" />
                <div>
                  <span className="font-35 nowrap">{formatRewardAmount(wrappedSymbol)}</span>
                  <span className="p-l-1">{wrappedSymbol}</span>
                </div>
              </div>
            </div>
            <Button className="cool width-200 m-t-1" loading={isTransacting} onClick={claimAllRewards}>
              CLAIM ALL
            </Button>
          </div>
        </div>
      </Fragment>
    );
  }

  function changeBg(selectedTabKey) {
    document.querySelector(".gradient-bg")?.classList.remove("gradient-bg-red", "gradient-bg-green", "gradient-bg-blue");

    if (selectedTabKey === "burn") {
      document.querySelector(".gradient-bg")?.classList.add("gradient-bg-red");
    } else if (selectedTabKey === "rewards") {
      document.querySelector(".gradient-bg")?.classList.add("gradient-bg-green");
    } else {
      document.querySelector(".gradient-bg")?.classList.add("gradient-bg-blue");
    }
  }

  return (
    <div className="appPageContent stakeandburn">
      <PageToolbar tokens={tokens} />
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

function CurrencyAmountAction({ defaultValue = "0", label = "", ActionButton }) {
  const [amount, setAmount] = useState(defaultValue);

  return (
    <Fragment>
      <CustomNumberInput value={amount} label={label} onAmountChange={setAmount} />
      <ActionButton amount={amount} />
    </Fragment>
  );
}

export default StakeAndBurn;
