import { useState } from "react";
import { useMoralis, useNativeBalance } from "react-moralis";
import { Button, Select, Modal, message } from "antd";
import chartplaceholder from "../../assets/chartplaceholder.png";
import CustomNumberInput from "./CustomNumberInput";
import lockIcon from "../../assets/lockicon.svg";
import PageToolbar from "./PageToolbar";
import NftTemplate from "./NftTemplate";

const { Option } = Select;

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Lock> JSX Elemenet
 */

function Lock(props) {
  const { contract, tokens } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { isInitialized, methods, tokenData } = tokens;
  const { checkThenAllowWrapped } = methods;
  const { tokenMetadata } = tokenData;
  const [isLocking, setIsLocking] = useState(false);
  const [amountLocked, setAmountLocked] = useState(1);
  const [timeLocked, setTimeLocked] = useState(3);
  const { nativeToken } = useNativeBalance();
  const nativeTokenSymbol = nativeToken?.symbol || null;

  const lockWrappedToken = async (amount, durationInMonths) => {
    setIsLocking(true);

    amount = Moralis.Units.ETH(amount);
    const durationInDays = durationInMonths * 30; // can't think of a better approximation! close enough?

    // TODO proper UI input validation. Also pull these values right from the smart contract or embed in the local contract data
    if (!amount || amount.length <= 0) {
      throw new Error("Freezer lock amount is invalid. Cannot lock: " + amount);
    }
    if (!durationInDays || durationInDays < 1) {
      throw new Error("Freezer lock duration is invalid. Cannot lock for: " + durationInDays + " days");
    }

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
        content: `You successfully locked ${amountLocked} ${nativeTokenSymbol} for ${timeLocked} months.`,
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
              <Select className="flex-half" value={timeLocked} style={{ width: 120 }} onChange={setTimeLocked}>
                {new Array(24).fill(1).map((_val, index) => (
                  <Option value={index + 1} key={`lock-amt-month-${index + 1}`}>
                    {index + 1}
                  </Option>
                ))}
              </Select>
              <span className="white-text flex-half align-left p-l-1">MONTHS</span>
            </div>
          </div>
          <div>
            <div className="choke-label">EARN</div>
            <div>
              <span className="font-35 notReady">99.99</span>
              <span className="p-l-1">{tokenMetadata?.frToken?.symbol || "frToken"}</span>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            className="full-width"
            onClick={() => Modal.confirm({ 
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
                      Please confirm the following information is correct before locking your freezer. Upon confirmation, the adjacent NFT will be minted to your wallet along with the number of {tokenMetadata?.frToken?.symbol} specified in the previous step. 
                    </p>
                    <p>
                    You can redeem the NFT to withdraw your {nativeTokenSymbol} from our freezer but be warned - withdrawing before the "Mature" date will incur a penalty. 
                    </p>
                  </div>
                  <div className="flex-half p-l-2">
                    {
                    NftTemplate({
                      lockDate: new Date(Date.now()),
                      lockDuration: timeLocked + " months", 
                      wrappedSymbol: tokenMetadata?.wrappedToken?.symbol,
                      wrappedAmount: amountLocked?.toFixed(3)
                    })
                    }
                  </div>
                </div>
              )
            })}
            disabled={isLocking || !isInitialized || !amountLocked}
            loading={isLocking}
          >
            Lock {amountLocked?.toPrecision(4)} {nativeTokenSymbol}
          </Button>
        </section>
        <section className="lock-chart flex-half notReady">
          <img className="img-placeholder" src={chartplaceholder} />
        </section>
      </div>
    </div>
  );
}

export default Lock;
