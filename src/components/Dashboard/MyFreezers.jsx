import { useMoralis } from "react-moralis";
import { Skeleton } from "antd";
import useToken from "hooks/useToken";
import NFTBalance from "components/NFTBalance";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <LockUnlock> JSX Elemenet
 */

function MyFreezers(props) {
  const { contract } = props;
  const { Moralis, account, isAuthenticated } = useMoralis();
  const { isInitialized, methods } = useToken({ contract });
  const { checkThenAllowFrToken, checkThenAllowWrapped } = methods;

  if (!isInitialized || (!props.address && (!account || !isAuthenticated)))
    return <Skeleton />;

  const unlockFreezer = async (freezerNFT) => {
    console.log("Unlocking freezer:");
    console.log(freezerNFT);

    if (!freezerNFT || (!freezerNFT.token_id && freezerNFT.token_id !== 0)) {
      console.error("Missing freezer token_id. Cannot unlock.");
      return 0.0;
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
      throw new Error("Token approvals failed. Cannot unlock freezer.");
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
      console.error(
        `Failed to unlock freezer: ${
          freezerNFT && freezerNFT.token_id
        }. ${err}`,
      );
    }
  };
  const fetchProgress = async (freezerNFT) => {
    if (!freezerNFT || (!freezerNFT.token_id && freezerNFT.token_id !== 0)) {
      console.error("Missing freezer tokenId. Cannot fetch unlock progress.");
      return 0.0;
    }

    const options = {
      contractAddress: contract.TrueFreezeGovernor.address,
      functionName: "getProgress",
      abi: contract.TrueFreezeGovernor.abi,
      params: {
        tokenId: freezerNFT.token_id,
      },
    };

    let progressAmount = 0.0;
    try {
      const freezerTransaction = await Moralis.executeFunction(options);
      progressAmount = freezerTransaction.toString();
      progressAmount = Number(progressAmount).toFixed(1);
    } catch (err) {
      console.error(
        `Failed to fetch unlock progress for freezer: ${
          freezerNFT && freezerNFT.token_id
        }. ${err}`,
      );
    }

    return progressAmount;
  };

  return (
    <div>
      <h3>My Freezers</h3>
      <NFTBalance
        filterByContractAddress={contract.nonFungiblePositionManager.address}
        unlockFreezer={unlockFreezer}
        fetchProgress={fetchProgress}
      />
    </div>
  );
}

export default MyFreezers;
