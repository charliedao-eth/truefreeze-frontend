import { useState } from "react";
import { useMoralis } from "react-moralis";
import { Button, Modal, message, InputNumber } from "antd";
import CustomNumberInput from "./CustomNumberInput";
import lockIcon from "../../assets/lockicon.svg";
import PageToolbar from "./PageToolbar";
import NftTemplate from "./NftTemplate";
import { LoadingOutlined } from "@ant-design/icons";
import React from "react";

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
  const [amountLocked, setAmountLocked] = useState(1);
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

  let isLoaded = true;
  if (!props.address && (!account || !isAuthenticated)) {
    isLoaded = false;
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
              <InputNumber
                className="small-input days-input"
                controls={false}
                size="small"
                min={CONTRACT_MIN_DAYS}
                max={CONTRACT_MAX_DAYS}
                defaultValue={timeLocked}
                onChange={setTimeLocked}
              />
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
                      <h1>Confirm Lock</h1>
                      <p>
                        Locking {tokenMetadata?.wrappedToken?.symbol} will pay you {tokenMetadata?.frToken?.symbol} and mint a Certificate of Deposit Freezer NFT.
                      </p>
                      <p className="m-t-1">Any Freezer NFT can be redeemed for its {tokenMetadata?.wrappedSymbol?.symbol} after the Maturity Date.</p>
                      <p className="m-t-1">
                        Early withdrawals before their Maturity Date incur variable {tokenMetadata?.frToken?.symbol} fees and a 0.25% {tokenMetadata?.wrappedSymbol?.symbol}{" "}
                        penalty. See <a href="/docs">Docs</a> for more details.
                      </p>
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
            disabled={isLocking || !isLoaded || !amountLocked}
            loading={isLocking}
          >
            {isLoaded ? (
              <React.Fragment>
                {wrappedSymbol ? (
                  <React.Fragment>
                    Lock {amountLocked?.toPrecision(4) / 1} {wrappedSymbol}
                  </React.Fragment>
                ) : (
                  <LoadingOutlined />
                )}
              </React.Fragment>
            ) : (
              "DISCONNECTED"
            )}
          </Button>
        </section>
        <section className="lock-chart flex-half"></section>
      </div>
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
