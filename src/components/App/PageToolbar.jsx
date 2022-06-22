import { useMoralis } from "react-moralis";
import {message} from "antd";
import frethIcon from "../../assets/frethicon.png";
import frzIcon from "../../assets/frzicon.png";
import ethIcon from "../../assets/ethicon.png";


export default function PageToolbar(props) {
  const { tokens } = props;
  const { account } = useMoralis();
  const { frTokenBalance, frzBalance, wrappedTokenBalance, tokenMetadata } = tokens.tokenData;

  const wrappedSymbol = tokenMetadata?.wrappedToken?.symbol;
  const frzSymbol = tokenMetadata?.FRZ?.symbol;
  const frTokenSymbol = tokenMetadata?.frToken?.symbol;

  const addTokenToWallet = async ({address, symbol, decimals = 18, image}) => {
    try {
      const addSuccess = await window?.ethereum?.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address,
            symbol,
            decimals,
            image,
          }
        }
      });

      if(addSuccess) {
        message.success({
          content: symbol + " added to your wallet.",
          duration: 3,
        });
      } else {
        message.warn({
          content: "Could not add " + symbol + " to your wallet.",
          duration: 3,
        });
      }
    } catch (error) {
      message.warn({
        content: "Could not add " + symbol + " to your wallet.",
        duration: 3,
      });
    }
  };

  const addFrTokenToWallet = () => addTokenToWallet({address: tokenMetadata?.frToken?.address, symbol: frTokenSymbol, image: frethIcon});
  const addFRZToWallet = () => addTokenToWallet({address: tokenMetadata?.FRZ?.address, symbol: frzSymbol, image: frzIcon});
  const addWrappedToWallet = () => addTokenToWallet({address: tokenMetadata?.wrappedToken?.address, symbol: wrappedSymbol, image: ethIcon});

  return (
    <section className="page-toolbar white-text m-b-1">
      <div className="wallet-info flex">
        <div>
          <div>
            <b>WALLET</b>
          </div>
          <div title={account || ""}>{account ? "0x..." + account?.substring(account?.length - 4, account?.length) : "--"}</div>
        </div>
        <div>
          <div title={`Click to add ${wrappedSymbol} to your wallet.`} onClick={addWrappedToWallet}>
            <b>{wrappedSymbol || "WRAPPED"}</b>
          </div>
          <div title={wrappedTokenBalance || ""}>{wrappedTokenBalance ? parseFloat(wrappedTokenBalance)?.toFixed(2) : "--"}</div>
        </div>
      </div>
      {props.children}
      <div className="curriencies inline-flex flex-align--right">
        <div className="frToken-holdings m-r-1">
          <div title={`Click to add ${frTokenSymbol} to your wallet.`} onClick={addFrTokenToWallet}>
            <b>{frTokenSymbol || "FRTOKEN"}</b>
          </div>
          <div title={frTokenBalance || ""}>{frTokenBalance ? parseFloat(frTokenBalance)?.toFixed(2) : "--"}</div>
        </div>
        <div className="frz-holdings">
          <div title={`Click to add ${frzSymbol} to your wallet.`} onClick={addFRZToWallet}>
            <b>{frzSymbol || "FRZ"}</b>
          </div>
          <div title={frzBalance || ""}>{frzBalance ? parseFloat(frzBalance)?.toFixed(2) : "--"}</div>
        </div>
      </div>
    </section>
  );
}
