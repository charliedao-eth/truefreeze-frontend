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
  const { methods } = tokens;
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

  function renderHelpfulTable() {
    const padSingleNum = (numStr) => ((numStr + "")?.length === 1 ? "0" + numStr : numStr);
    const dateInXDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const lockDate = new Date(); // today
    const breakevenDate = dateInXDays(parseInt(timeLocked) * 0.667);
    const maturityDate = dateInXDays(parseInt(timeLocked));

    const lockDay = lockDate.getDate();
    const lockMonth = lockDate.getMonth() + 1; // getMonth() returns month from 0 to 11
    const lockYear = lockDate.getFullYear();

    const breakevenDay = breakevenDate.getDate();
    const breakevenMonth = breakevenDate.getMonth() + 1; // getMonth() returns month from 0 to 11
    const breakevenYear = breakevenDate.getFullYear();

    const maturityDay = maturityDate.getDate();
    const maturityMonth = maturityDate.getMonth() + 1; // getMonth() returns month from 0 to 11
    const maturityYear = maturityDate.getFullYear();

    const lockDateString = `${lockYear}-${padSingleNum(lockMonth)}-${padSingleNum(lockDay)}`;
    const breakevenDateString = `${breakevenYear}-${padSingleNum(breakevenMonth)}-${padSingleNum(breakevenDay)}`;
    const maturityDateString = `${maturityYear}-${padSingleNum(maturityMonth)}-${padSingleNum(maturityDay)}`;

    /*
    Date | frETH Fee | WETH Penalty 
    (Today) YYYY-MM-DD | 120 frETH | 0.25% WETH
    (2/3rds of way) YYYY-MM-DD | 100 frETH | 0.25% WETH 
    Maturity Date YYYY-MM-DD | 0 frETH | 0% WETH
  
  
    */
    const dataSource = [
      {
        key: "0",
        date: `(Today) ${lockDateString}`,
        frTokenFee: costToWithdraw(amountLocked, timeLocked, 0),
        wrappedPenalty: `${(0.0025 * amountLocked)?.toFixed(2) / 1} ${wrappedSymbol} (0.25%)`,
      },
      {
        key: "1",
        date: `(2/3ds of way) ${breakevenDateString}`,
        frTokenFee: costToWithdraw(amountLocked, timeLocked, timeLocked * 0.67),
        wrappedPenalty: `${(0.0025 * amountLocked)?.toFixed(2) / 1} ${wrappedSymbol} (0.25%)`,
      },
      {
        key: "2",
        date: `Maturity date ${maturityDateString}`,
        frTokenFee: 0,
        wrappedPenalty: `0 ${wrappedSymbol}`,
      },
    ];

    const columns = [
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
        title: `${wrappedSymbol} Penalty`,
        dataIndex: "wrappedPenalty",
        key: "wrappedPenalty",
      },
    ];

    return (
      <Table className="preview-table" dataSource={dataSource} columns={columns} bordered={false} expandable={false} pagination={{ top: "none", bottom: "none" }} size="small" />
    );
  }

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
          <CustomNumberInput onAmountChange={(val) => setAmountLocked(parseFloat(val) || "")} value={amountLocked} label="AMOUNT" />
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
        <section className="lock-chart flex-half">
          <ErrorBoundary fallback={<WarningTwoTone />}>{renderHelpfulTable()}</ErrorBoundary>
        </section>
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
