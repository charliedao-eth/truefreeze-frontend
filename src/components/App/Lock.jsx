import { useMoralis } from "react-moralis";
import { Skeleton, Button, InputNumber } from "antd";
import useToken from "hooks/useToken";
import { useState } from "react";
import chartplaceholder from "../../assets/chartplaceholder.png";

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

  const lockWrappedToken = async (amount, durationInDays) => {
    setIsLocking(true);

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

      return freezerConfirmation;
    } catch (err) {
      // TODO user error messaging
      console.error("Freezer locking request failed. ");
      console.error(err);
    } finally {
      setIsLocking(false);
    }
  };

  if (!props.address && (!account || !isAuthenticated)) return <Skeleton />;

  const onAmountChange = (value) => {
    console.log(value);
  };

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
              defaultValue="1"
              min="0"
              step="0.1"
              precision={8}
              onChange={onAmountChange}
              stringMode
            />
          </label>
          <Button
            type="primary"
            size="large"
            className="full-width"
            onClick={() => lockWrappedToken(Moralis.Units.ETH(0.01), 10)}
            disabled={isLocking || !isInitialized}
            loading={isLocking}
          >
            Lock 0.01 ETH
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
