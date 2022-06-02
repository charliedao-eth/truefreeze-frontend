import { useMoralis, useNativeBalance } from "react-moralis";

export default function PageToolbar(props) {
  const { tokens } = props;
  const { account, Moralis } = useMoralis();
  const { frTokenBalance, frzBalance, wrappedTokenBalance, tokenMetadata } = tokens.tokenData;
  const { data: balance, nativeToken } = useNativeBalance();

  const nativeAmounts = {
    balance: balance?.balance && balance.balance !== "0" ? parseFloat(Moralis.Units.FromWei(balance.balance))?.toFixed(2) : null,
    symbol: nativeToken?.symbol || null,
  };

  return (
    <section className="page-toolbar white-text m-b-1">
      <div className="wallet-info flex">
        <div>
          <div>
            <b>WALLET</b>
          </div>
          <div>0x...{account?.substring(account?.length - 4, account?.length)}</div>
        </div>
        <div>
          <div>
            <b>{nativeAmounts.symbol}</b>
          </div>
          <div>{nativeAmounts.balance}</div>
        </div>
        <div>
          <div>
            <b>{tokenMetadata?.wrappedToken?.symbol || "WRAPPED"}</b>
          </div>
          <div>{wrappedTokenBalance ? parseFloat(wrappedTokenBalance)?.toFixed(2) : "--"}</div>
        </div>
      </div>
      {props.children}
      <div className="curriencies inline-flex flex-align--right">
        <div className="frToken-holdings m-r-1">
          <div>
            <b>{tokenMetadata?.frToken?.symbol || "--"}</b>
          </div>
          <div>{frTokenBalance ? parseFloat(frTokenBalance)?.toFixed(2) : "--"}</div>
        </div>
        <div className="frz-holdings">
          <div>
            <b><b>{tokenMetadata?.FRZ?.symbol || "FRZ"}</b></b>
          </div>
          <div>{frzBalance ? parseFloat(frzBalance)?.toFixed(2) : "--"}</div>
        </div>
      </div>
    </section>
  );
}
