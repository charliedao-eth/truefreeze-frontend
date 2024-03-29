import { useMoralis } from "react-moralis";
import { message } from "antd";
import { getChainName } from "helpers/networks";
import NFTBalance from "components/NFTBalance";
import PageToolbar from "./PageToolbar";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <LockUnlock> JSX Elemenet
 */

function MyFreezers(props) {
  const { contract, tokens, compatibilityMode: CM = false } = props;
  const { Moralis, account, isAuthenticated, chainId } = useMoralis();
  const { isInitialized, methods, tokenData } = tokens;
  const { tokenMetadata } = tokenData;
  const { checkThenAllowFrToken, checkThenAllowWrapped } = methods;

  if (!isInitialized || (!props.address && (!account || !isAuthenticated))) {
    return <div className="appPageContent" />;
  }

  const unlockFreezer = async (freezerNFT) => {
    console.log("Unlocking freezer:");
    console.log(freezerNFT);

    if (!freezerNFT || (!freezerNFT.token_id && freezerNFT.token_id !== 0)) {
      console.error("Missing freezer token_id. Cannot unlock.");
      return "error";
    }

    const [frTokenCost, wrappedTokenFees] = await fetchUnlockCostAndFees(freezerNFT); // TODO we fetch this twice. could store it instead. ah, whatever.
    if (frTokenCost && wrappedTokenFees) {
      if (Number(frTokenCost.amount) > Number(tokenData?.frTokenBalance)) {
        message.error({
          content: `You don't have enough ${frTokenCost?.symbol} to cover penalties.`,
          duration: 5,
        });
        return "error";
      }
      if (Number(wrappedTokenFees.amount) > Number(tokenData?.wrappedTokenBalance)) {
        message.error({
          content: `You don't have enough ${wrappedTokenFees?.symbol} to cover penalties.`,
          duration: 5,
        });
        return "error";
      }
    }

    try {
      await checkThenAllowFrToken({
        spender: contract.TrueFreezeGovernor.address,
      });
      await checkThenAllowWrapped({
        spender: contract.TrueFreezeGovernor.address,
      });
    } catch (err) {
      console.error(err);
      message.error({
        content: "Token approvals failed. Cannot unlock freezer. Press to see error logs.",
        duration: 4,
        onClick: () => alert(JSON.stringify(err)),
      });
      return "error";
    }

    // TODO use getWAssetFees and getUnlockCost + balances from useToken() to estimate if this will fail BEFORE the user tries the transaction. better ux by removing that frustring failure case

    const options = {
      contractAddress: contract.TrueFreezeGovernor.address,
      functionName: "withdrawWAsset",
      abi: contract.TrueFreezeGovernor.abi,
      params: {
        _tokenId: freezerNFT.token_id,
      },
    };

    try {
      const freezerTransaction = await Moralis.executeFunction(options);
      return freezerTransaction.wait(); // in case you want to listen for blockchain confirmation
    } catch (err) {
      console.error(`Failed to unlock freezer: ${freezerNFT && freezerNFT.token_id}. ${err}`);
      message.error({
        content: "Freezer unlocking failed. Press to see error logs.",
        duration: 4,
        onClick: () => alert(`freezer ${freezerNFT?.token_id} unlock failed: ` + JSON.stringify(err)),
      });
      return "error";
    }
  };
  const fetchProgressAndImages = async (freezerNFT) => {
    if (!freezerNFT || (!freezerNFT.token_id && freezerNFT.token_id !== 0)) {
      console.error("Missing freezer tokenId. Cannot fetch unlock progress.");
      return 0.0;
    }

    const progressOptions = {
      contractAddress: contract.TrueFreezeGovernor.address,
      functionName: "getProgress",
      abi: contract.TrueFreezeGovernor.abi,
      params: {
        tokenId: freezerNFT.token_id,
      },
    };
    const metadataOptions = {
      contractAddress: contract.nonFungiblePositionManager.address,
      functionName: "tokenURI",
      abi: contract.nonFungiblePositionManager.abi,
      params: {
        tokenId: freezerNFT.token_id,
      },
    };

    let progressAmount = 0.0;
    let base64ImageString = "";
    try {
      const freezerProgressTransaction = await Moralis.executeFunction(progressOptions);
      progressAmount = freezerProgressTransaction.toString();
      progressAmount = Number(progressAmount).toFixed(1);
      const freezerMetadataTransaction = await Moralis.executeFunction(metadataOptions);
      base64ImageString = JSON.parse(window.atob(freezerMetadataTransaction?.toString().split(",")?.[1]))?.image || null; // we're just decoding and ripping apart the metadata in one nasty step. i should be fired for this line
    } catch (err) {
      console.error(`Failed to fetch unlock progress for freezer: ${freezerNFT && freezerNFT.token_id}. ${err}`);
    }

    return { progressAmount, base64ImageString, tokenId: freezerNFT.token_id };
  };
  const fetchUnlockCostAndFees = async (freezerNFT) => {
    if (!freezerNFT || (!freezerNFT.token_id && freezerNFT.token_id !== 0)) {
      console.error("Missing freezer tokenId. Cannot fetch unlock costs.");
      return [null, null];
    }

    const unlockCostOptions = {
      contractAddress: contract.TrueFreezeGovernor.address,
      functionName: "getUnlockCost",
      abi: contract.TrueFreezeGovernor.abi,
      params: {
        _tokenId: freezerNFT.token_id,
      },
    };
    const unlockFeeOptions = {
      contractAddress: contract.TrueFreezeGovernor.address,
      functionName: "getWAssetFees",
      abi: contract.TrueFreezeGovernor.abi,
      params: {
        _tokenId: freezerNFT.token_id,
      },
    };

    let unlockCost = null;
    let unlockFee = null;

    try {
      const costTransaction = await Moralis.executeFunction(unlockCostOptions);
      const feeTransaction = await Moralis.executeFunction(unlockFeeOptions);
      unlockCost = {
        amount: Moralis.Units.FromWei(costTransaction),
        symbol: tokenMetadata?.frToken?.symbol,
        displayAmount: parseFloat(Moralis.Units.FromWei(costTransaction))?.toFixed(8) / 1,
      };
      unlockFee = {
        amount: Moralis.Units.FromWei(feeTransaction),
        symbol: tokenMetadata?.wrappedToken?.symbol,
        displayAmount: parseFloat(Moralis.Units.FromWei(feeTransaction))?.toFixed(8) / 1,
      };
    } catch (err) {
      console.error(`Failed to fetch unlock costs and fees for freezer: ${freezerNFT && freezerNFT.token_id}. ${err}`);
    }

    // [cost in frToken, fee in wrapped token]
    return [unlockCost, unlockFee];
  };

  return (
    <div className="appPageContent myfreezers">
      {!CM && <PageToolbar tokens={tokens} />}
      <NFTBalance
        filterByContractAddress={contract.nonFungiblePositionManager.address}
        unlockFreezer={unlockFreezer}
        fetchProgressAndImages={fetchProgressAndImages}
        fetchUnlockCostAndFees={fetchUnlockCostAndFees}
        className="page-scroll-container"
      />
      <div className="m-t-1 flex justify-center">
        <a
          className="white-button"
          rel="noreferrer"
          target={"_blank"}
          href={`https://x2y2.io/collection/truefreeze`}
        >
          BUY FREEZER ON MARKETPLACE
        </a>
      </div>
    </div>
  );
}

export default MyFreezers;
