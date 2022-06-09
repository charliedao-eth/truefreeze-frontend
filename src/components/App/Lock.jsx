import { useState } from "react";
import { useMoralis } from "react-moralis";
import { Button, Modal, message, InputNumber } from "antd";
import CustomNumberInput from "./CustomNumberInput";
import lockIcon from "../../assets/lockicon.svg";
import PageToolbar from "./PageToolbar";
import NftTemplate from "./NftTemplate";
import LineChart from "react-linechart";
import "react-linechart/dist/styles.css";
import { LoadingOutlined } from "@ant-design/icons";

// Lock limits on UI
const CONTRACT_MIN_DAYS = 1;
const CONTRACT_MAX_DAYS = 1100;

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Lock> JSX Elemenet
 */

function Lock(props) {
  const { contract, tokens } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { isInitialized, methods } = tokens;
  const { checkThenAllowWrapped } = methods;
  const { wrappedTokenBalance, tokenMetadata } = tokens.tokenData;
  const [isLocking, setIsLocking] = useState(false);
  const [amountLocked, setAmountLocked] = useState(10);
  const [timeLocked, setTimeLocked] = useState(30);
  const wrappedSymbol = tokenMetadata?.wrappedToken?.symbol || "";

  const lockWrappedToken = async (amount, durationInDays) => {
    if (parseFloat(wrappedTokenBalance) <= amount) {
      message.error({
        content: `Not enough ${wrappedSymbol}. Your balance is ${parseFloat(wrappedTokenBalance)?.toFixed(2) / 1}`,
        duration: 6,
      });
      return;
    }

    setIsLocking(true);

    amount = Moralis.Units.ETH(amount);

    try {
      await checkThenAllowWrapped({
        spender: contract.TrueFreezeGovernor.address,
      });

      const options = {
        contractAddress: contract.TrueFreezeGovernor.address,
        functionName: "lockWAsset",
        abi: contract.TrueFreezeGovernor.abi,
        params: {
          _amount: amount,
          _lockDuration: durationInDays,
        },
      };
      const freezerTransaction = await Moralis.executeFunction(options);
      console.log(freezerTransaction);

      const freezerConfirmation = await freezerTransaction.wait();
      console.log(freezerConfirmation);
      Modal.success({
        content: `You successfully locked ${amountLocked} ${wrappedSymbol} for ${timeLocked} days.`,
      });

      setIsLocking(false);
    } catch (err) {
      // TODO user error messaging
      setIsLocking(false);
      console.error("Freezer locking request failed. ");
      console.error(err);
      message.error({
        content: "Freezer locking failed. Press to see error logs.",
        duration: 4,
        onClick: () => alert(JSON.stringify(err)),
      });
    }
  };

  if (!props.address && (!account || !isAuthenticated)) {
    return <div className="appPageContent" />;
  }

  return (
    <div className="appPageContent lock-page">
      <PageToolbar tokens={tokens} />
      <div className="flex justify-center m-t-2">
        <section className="translucent-card tall flex-half m-r-2">
          <img src={lockIcon} className="card-icon" />
          <h3 className="card-title">Lock</h3>
          <CustomNumberInput onAmountChange={(val) => setAmountLocked(parseFloat(val))} value={amountLocked} label="AMOUNT" />
          <div>
            <div>TIME</div>
            <div className="inline-flex flex-row bottom">
              <InputNumber className="small-input days-input" size="small" min={CONTRACT_MIN_DAYS} max={CONTRACT_MAX_DAYS} defaultValue={timeLocked} onChange={setTimeLocked} />
              <span className="white-text flex-half align-left p-l-1">DAYS</span>
            </div>
          </div>
          <div>
            <div className="choke-label">EARN</div>
            <div>
              <span className="font-35">{amountLocked > 0 ? ethToFrEthEarned(amountLocked, timeLocked)?.toFixed(3) / 1 : "--"}</span>
              <span className="p-l-1">{tokenMetadata?.frToken?.symbol || ""}</span>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            className="full-width"
            onClick={() =>
              Modal.confirm({
                centered: true,
                width: 900,
                icon: null,
                cancelText: "GO BACK",
                okText: "CONFIRM LOCK",
                onOk: () => lockWrappedToken(amountLocked, timeLocked),
                content: (
                  <div className="flex">
                    <div className="flex-half p-4">
                      <h1>Confirm Choice</h1>
                      <p>
                        Please confirm the following information is correct before locking your freezer. Upon confirmation, the adjacent NFT will be minted to your wallet along
                        with the number of {tokenMetadata?.frToken?.symbol} specified in the previous step.
                      </p>
                      <p>You can redeem the NFT to withdraw your {wrappedSymbol} from our freezer but be warned - withdrawing before the "Mature" date will incur a penalty.</p>
                    </div>
                    <div className="flex-half p-l-2">
                      {NftTemplate({
                        lockDate: new Date(Date.now()),
                        lockDuration: timeLocked + " days",
                        wrappedSymbol: tokenMetadata?.wrappedToken?.symbol,
                        wrappedAmount: amountLocked?.toFixed(3),
                      })}
                    </div>
                  </div>
                ),
              })
            }
            disabled={isLocking || !isInitialized || !amountLocked}
            loading={isLocking}
          >
            Lock {amountLocked?.toPrecision(4) / 1} {wrappedSymbol || <LoadingOutlined />}
          </Button>
        </section>
        <section className="lock-chart flex-half">
          <LockChart frTokenSymbol={tokenMetadata?.frToken?.symbol} daysLocked={timeLocked} frTokenAmount={ethToFrEthEarned(amountLocked, timeLocked)} />
        </section>
      </div>
    </div>
  );
}

function getFrEthGain({ frTokenAmount, daysLocked, unlockDay }) {
  const BREAK_EVEN = 0.67 * daysLocked;
  const MIN_RETURN = -0.2 * frTokenAmount;
  const MAX_RETURN = frTokenAmount;

  const isProfitable = unlockDay >= BREAK_EVEN;
  if (isProfitable) {
    return MAX_RETURN * ((unlockDay - BREAK_EVEN) / (daysLocked - BREAK_EVEN));
  } else {
    return MIN_RETURN + (unlockDay / BREAK_EVEN) * (-1 * MIN_RETURN);
  }
}

function LockChart({ frTokenAmount, daysLocked, frTokenSymbol = "frToken" }) {
  // this thing is redrawing A LOT

  /*
  const data = [
    {									
      color: "red", 
      points: [{x: 0, y: -0.2 * frTokenAmount}, {x: 0.67 * daysLocked, y: 0}]
    },
    {									
      color: "steelblue", 
      points: [{x: 0.67 * daysLocked, y: 0}, {x: daysLocked, y: frTokenAmount}]
    },
  ];
  */

  daysLocked = Math.floor(daysLocked);

  if (daysLocked < 1 || frTokenAmount <= 0) {
    return <div></div>;
  }

  const breakEvenDay = Math.floor(daysLocked * 0.67);
  // todo force to integer
  const lossPoints = new Array(breakEvenDay + 1)
    .fill(0)
    .map((_val, index) => index)
    .map((unlockDay) => {
      return {
        x: unlockDay,
        y: getFrEthGain({ frTokenAmount, daysLocked, unlockDay }),
      };
    });
  const profitPoints = new Array(daysLocked - breakEvenDay + 1)
    .fill(0)
    .map((_val, index) => breakEvenDay + index)
    .map((unlockDay) => {
      return {
        x: unlockDay,
        y: getFrEthGain({ frTokenAmount, daysLocked, unlockDay }),
      };
    });

  const data = [
    {
      color: "rgba(255,255,255,0.1)",
      points: [
        { x: 0, y: 0 },
        { x: daysLocked, y: 0 },
      ],
    },
    {
      color: "red",
      points: lossPoints,
    },
    {
      color: "steelblue",
      points: profitPoints,
    },
  ];

  return (
    <div>
      <LineChart
        width={400}
        height={300}
        data={data}
        xMin={0}
        xMax={daysLocked}
        yMin={-0.2 * frTokenAmount}
        yMax={frTokenAmount}
        xLabel={"Days until you unlock"}
        yLabel={frTokenSymbol + " gains"}
        hideXAxis={false}
        hideYAxis={false}
        onPointHover={({ x, y }) => {
          if (Math.abs(y) <= 0.001) {
            return "Break-even (0 " + frTokenSymbol + ")";
          }
          return `Unlock in ${x} days: ${y?.toFixed(2)} ${frTokenSymbol}`;
        }}
      />
    </div>
  );
}

export function costToWithdraw(amountLocked, lockDurationInDays, timeSinceLockInDays) {
  const progress = timeSinceLockInDays / lockDurationInDays;
  if (progress >= 1) {
    return 0;
  }

  if (progress < 0.67) {
    return amountLocked + 0.2 * amountLocked * (1 - progress / 0.67);
  } else {
    return amountLocked * (1 - (progress - 0.67) / 0.33);
  }
}

export function ethToFrEthEarned(amountInEth, daysLocked) {
  return (amountInEth * daysLocked) / 365;
}

export default Lock;
