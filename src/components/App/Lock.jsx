import { useState } from "react";
import { useMoralis } from "react-moralis";
import { Button, Modal, message, InputNumber, Table } from "antd";
import CustomNumberInput from "./CustomNumberInput";
import lockIcon from "../../assets/lockicon.svg";
import PageToolbar from "./PageToolbar";
import NftTemplate from "./NftTemplate";
import { LoadingOutlined, WarningTwoTone } from "@ant-design/icons";
import React from "react";
import { DOCS_URL } from "App";
import { ErrorBoundary } from "react-error-boundary";
import { noScience } from "helpers/formatters";

// Lock limits on UI
const CONTRACT_MIN_DAYS = 1;
const CONTRACT_MAX_DAYS = 1100;

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Lock> JSX Elemenet
 */

function Lock(props) {
  const { contract, tokens, compatibilityMode: CM = false } = props;
  const { Moralis, account, isWeb3Enabled } = useMoralis();
  const { methods, isInitialized } = tokens;
  const { checkThenAllowWrapped } = methods;
  const { wrappedTokenBalance, tokenMetadata } = tokens.tokenData;
  const [isLocking, setIsLocking] = useState(false);
  const [amountLocked, setAmountLocked] = useState(1);
  const [timeLocked, setTimeLocked] = useState(30);
  const wrappedSymbol = tokenMetadata?.wrappedToken?.symbol || "";
  const frTokenSymbol = tokenMetadata?.frToken?.symbol || "";

  const lockWrappedToken = async (amount, durationInDays) => {
    if (parseFloat(wrappedTokenBalance) <= amount) {
      message.error({
        content: `Not enough ${wrappedSymbol}. Your balance is ${parseFloat(wrappedTokenBalance)?.toFixed(2) / 1}`,
        duration: 6,
      });
      return;
    }

    setIsLocking(true);

    amount = Moralis.Units.ETH(noScience(amount));

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

  function renderHelpfulTable() {
    const padSingleNum = (numStr) => ((numStr + "")?.length === 1 ? "0" + numStr : numStr);
    const tinyNum = (num, digitz = 2) => num?.toFixed?.(digitz) / 1 || num;
    const dateInXDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const generateDateStringInXDays = (days) => {
      // use a number, this ain't typescripe
      days = parseInt(days);
      const date = dateInXDays(days);
      const day = date.getDate();
      const month = date.getMonth() + 1; // getMonth() returns month from 0 to 11
      const year = date.getFullYear();

      const dateString = `${year}-${padSingleNum(month)}-${padSingleNum(day)}`;
      return dateString;
    };

    const lockDateString = generateDateStringInXDays(0);
    const fittyDateString = generateDateStringInXDays(timeLocked * 0.5);
    const breakevenDateString = generateDateStringInXDays(timeLocked * 0.67);
    const seventyFiveDateString = generateDateStringInXDays(timeLocked * 0.75);
    const maturityDateString = generateDateStringInXDays(timeLocked);

    const frTokenFees = [
      costToWithdraw(ethToFrEthEarned(amountLocked, timeLocked), timeLocked, 0),
      costToWithdraw(ethToFrEthEarned(amountLocked, timeLocked), timeLocked, timeLocked * 0.5),
      costToWithdraw(ethToFrEthEarned(amountLocked, timeLocked), timeLocked, timeLocked * 0.67),
      costToWithdraw(ethToFrEthEarned(amountLocked, timeLocked), timeLocked, timeLocked * 0.75),
    ];
    const wethPenalties = [0.0025 * amountLocked, 0.0025 * amountLocked, 0.0025 * amountLocked, 0.0025 * amountLocked];

    const dataSource = [
      {
        key: "0",
        progress: "0%",
        date: lockDateString,
        frTokenFee: tinyNum(frTokenFees[0]),
        wrappedPenalty: `${tinyNum(wethPenalties[0])} ${wrappedSymbol}`,
      },
      {
        key: "1",
        progress: "50%",
        date: fittyDateString,
        frTokenFee: tinyNum(frTokenFees[1]),
        wrappedPenalty: `${tinyNum(wethPenalties[1])} ${wrappedSymbol}`,
      },
      {
        key: "2",
        progress: "67%",
        date: breakevenDateString,
        frTokenFee: tinyNum(frTokenFees[2]),
        wrappedPenalty: `${tinyNum(wethPenalties[2])} ${wrappedSymbol}`,
      },
      {
        key: "3",
        progress: "75%",
        date: seventyFiveDateString,
        frTokenFee: tinyNum(frTokenFees[3]),
        wrappedPenalty: `${tinyNum(wethPenalties[3])} ${wrappedSymbol}`,
      },
      {
        key: "4",
        progress: "100%",
        date: maturityDateString,
        frTokenFee: 0,
        wrappedPenalty: `0 ${wrappedSymbol}`,
      },
    ];

    const columns = [
      {
        title: "Progress",
        dataIndex: "progress",
        key: "progress",
      },
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
      },
      {
        title: `${frTokenSymbol} Fee`,
        dataIndex: "frTokenFee",
        key: "frTokenFee",
      },
      {
        title: `${wrappedSymbol} Penalty (0.25%)`,
        dataIndex: "wrappedPenalty",
        key: "wrappedPenalty",
      },
    ];

    return (
      <Table className="preview-table" dataSource={dataSource} columns={columns} bordered={false} expandable={false} pagination={{ top: "none", bottom: "none" }} size="small" />
    );
  }

  let isLoaded = true;
  if (!props.address && (!account || !isWeb3Enabled)) {
    isLoaded = false;
  }

  return (
    <div className="appPageContent lock-page">
      <PageToolbar tokens={tokens} />
      <div className="flex justify-center m-t-2 cm--flex-column">
        <section className="translucent-card tall flex-half m-r-2">
          <img src={lockIcon} className="card-icon" />
          <h3 className="card-title">Lock</h3>
          <CustomNumberInput
            onAmountChange={(val) => setAmountLocked(parseFloat(val) || "")}
            value={amountLocked}
            label="AMOUNT"
            disabled={!isInitialized}
            title={isInitialized ? "" : "Please wait while token data loads"}
          />
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
                disabled={!isInitialized}
                title={isInitialized ? "" : "Please wait while token data loads"}
              />
              <span className="white-text flex-half align-left p-l-1">DAYS</span>
            </div>
          </div>
          <div>
            <div className="choke-label">EARN</div>
            <div>
              <span className="font-35">{amountLocked !== "" && amountLocked > 0 ? ethToFrEthEarned(amountLocked, timeLocked)?.toFixed(3) / 1 : "--"}</span>
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
                        penalty. See <a href={DOCS_URL}>Docs</a> for more details.
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
                {wrappedSymbol && typeof amountLocked === "number" ? (
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
        {!CM && (
          <section className="lock-chart flex-half">
            <ErrorBoundary fallback={<WarningTwoTone />}>{renderHelpfulTable()}</ErrorBoundary>
          </section>
        )}
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
