import { useMoralis } from "react-moralis";
import { Skeleton, Button, InputNumber, Select, Modal, message } from "antd";
import useToken from "hooks/useToken";
import { useState } from "react";
import chartplaceholder from "../../assets/chartplaceholder.png";

const { Option } = Select;

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Lock> JSX Elemenet
 */

function Lock(props) {
  const { contract } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { isInitialized, methods } = useToken({ contract });
  const { checkThenAllowWrapped } = methods;
  const [isLocking, setIsLocking] = useState(false);
  const [amountLocked, setAmountLocked] = useState(1);
  const [timeLocked, setTimeLocked] = useState(3);

  const lockWrappedToken = async (amount, durationInMonths) => {
    setIsLocking(true);

    amount = Moralis.Units.ETH(amount);
    const durationInDays = durationInMonths * 30; // can't think of a better approximation! close enough?

    // TODO proper UI input validation. Also pull these values right from the smart contract or embed in the local contract data
    if (!amount || amount.length <= 0) {
      throw new Error("Freezer lock amount is invalid. Cannot lock: " + amount);
    }
    if (!durationInDays || durationInDays < 1) {
      throw new Error(
        "Freezer lock duration is invalid. Cannot lock for: " +
          durationInDays +
          " days",
      );
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
        content: `You successfully locked ${amountLocked} ETH for ${timeLocked} months.`,
      });

      return freezerConfirmation;
    } catch (err) {
      // TODO user error messaging
      console.error("Freezer locking request failed. ");
      console.error(err);
      message.error({
        content: "Freezer locking failed. Press to see error logs.",
        duration: 4,
        onClick: () => alert(JSON.stringify(err)),
      });
    } finally {
      setIsLocking(false);
    }
  };

  if (!props.address && (!account || !isAuthenticated)) return <Skeleton />;

  return (
    <div className="appPageContent lock-page">
      <section className="page-toolbar white-text">
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
      <div className="flex justify-center m-t-2">
        <section className="white-text lock-card flex-half m-r-2">
          <h3 className="card-title">Lock</h3>
          <label>
            AMOUNT
            <InputNumber
              style={{
                width: "100%",
              }}
              value={amountLocked}
              min="0"
              step="0.1"
              precision={4}
              onChange={(val) => setAmountLocked(parseFloat(val))}
              stringMode
            />
          </label>
          <div>
            <div>TIME</div>
            <div className="inline-flex flex-row bottom">
              <Select
                className="flex-half"
                value={timeLocked}
                style={{ width: 120 }}
                onChange={setTimeLocked}
              >
                {new Array(24).fill(1).map((_val, index) => (
                  <Option value={index + 1}>{index + 1}</Option>
                ))}
              </Select>
              <span className="white-text flex-half align-left p-l-1">
                MONTHS
              </span>
            </div>
          </div>
          <div>
            <div className="choke-label">EARN</div>
            <div>
              <span className="font-35 notReady">99.99</span>
              <span className="p-l-1">frETH</span>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            className="full-width"
            onClick={() => lockWrappedToken(amountLocked, timeLocked)}
            disabled={isLocking || !isInitialized || !amountLocked}
            loading={isLocking}
          >
            Lock {amountLocked?.toPrecision(4)} ETH
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
