import { useState } from "react";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";
import { getWrappedNative, getWrappedABI } from "helpers/networks";

export default function useToken({ contract }) {
  const { account, chainId, Moralis } = useMoralis();
  const Web3Api = useMoralisWeb3Api();

  const [isInitialized, setIsInitialized] = useState(false);
  const [frTokenTotalSupply, setFrTokenTotalSupply] = useState(""); // keep BigNumbers as strings in javascript to avoid rounding errors due to differences between JS and ethereum
  const [frTokenBalance, setFrTokenBalance] = useState("");
  const [frzTotalSupply, setFrzTotalSupply] = useState("");
  const [frzBalance, setFrzBalance] = useState("");
  const [wrappedTokenBalance, setWrappedTokenBalance] = useState("");
  const [frTokenBurnt, setFrTokenBurnt] = useState("");
  const [frTokenTotalBurnt, setFrTokenTotalBurnt] = useState("");
  const frzFlowShare = (() => {
    if (frTokenBurnt && frTokenTotalBurnt) {
      try {
        const yourBurn = parseFloat(frTokenBurnt);
        const totalBurn = parseFloat(frTokenTotalBurnt) || 0.0000000000001; // prevent divide by zero
        const percentShare = (yourBurn / totalBurn) * 100;

        return percentShare >= 0 ? percentShare.toFixed(4) : "";
      } catch (err) {
        console.error("Error. Could not calculate FRZ flow share: ");
        console.error(err);
      }
    }
    return "";
  })();
  const [frzStaked, setFrzStaked] = useState("");
  const [frzTotalStaked, setFrzTotalStaked] = useState("");
  // TODO \/ this data is not simple to retrieve. do it later
  // const [frTokenTotalPenalities, setFrTokenTotalPenalities] = useState("");
  // const [wrappedTokenTotalPenalities, setWrappedTokenTotalPenalities] = useState("");
  const [rewardTokens, setRewardTokens] = useState(null);
  const [tokenMetadata, setTokenMetadata] = useState(null);

  // TODO use FRZ and frToken contract getters to fetch token metadata, then use that metadata to add our custom tokens to their wallet token list like so:
  // https://docs.metamask.io/guide/registering-your-token.html

  const wrappedTokenMetadata = { ...getWrappedABI(chainId), tokenAddress: getWrappedNative(chainId) };
  // TODO make more generic balance and supply functions and use some switching logic to reduce the amount of code here
  const _getWrappedTokenBalance = async ({ tokenAddress }) => {
    tokenAddress = tokenAddress.toLowerCase();
    const options = {
      chain: chainId,
    };
    const response = await Web3Api.account.getTokenBalances(options); // note, this api can fetch all ERC-20s at once, but we're not using that in anticipation of switching to web 3 provider + ether.js refactor
    return response.filter((tokenBalance) => tokenBalance.token_address.toLowerCase() === tokenAddress).map((tokenBalance) => tokenBalance.balance); // grab just the balance from the one we want
  };
  const _frTokenTotalSupply = async ({ contract }) => {
    const options = {
      contractAddress: contract.frToken.address,
      functionName: "totalSupply",
      abi: contract.frToken.abi,
    };
    return await Moralis.executeFunction(options);
  };
  const _frTokenBalance = async ({ contract, account }) => {
    const options = {
      contractAddress: contract.frToken.address,
      functionName: "balanceOf",
      abi: contract.frToken.abi,
      params: {
        account: account,
      },
    };
    return await Moralis.executeFunction(options);
  };
  const _frzTotalSupply = async ({ contract }) => {
    const options = {
      abi: contract.FRZ.abi,
      contractAddress: contract.FRZ.address,
      functionName: "totalSupply",
    };
    return await Moralis.executeFunction(options);
  };
  const _frzBalance = async ({ contract, account }) => {
    const options = {
      abi: contract.FRZ.abi,
      contractAddress: contract.FRZ.address,
      functionName: "balanceOf",
      params: {
        account: account,
      },
    };
    return await Moralis.executeFunction(options);
  };

  /*
  DONE wrappedTokenBalance

  frTokenBurnt
  frTokenTotalBurnt
  frzFlowShare
  
  frzStaked
  frzTotalStaked
  
  frTokenTotalPenalities
  wrappedTokenTotalPenalities

  */
  const _frTokenBurnt = async ({ contract, account }) => {
    const options = {
      contractAddress: contract.frTokenStaking.address,
      functionName: "balanceOf",
      abi: contract.frTokenStaking.abi,
      params: {
        account: account,
      },
    };
    return await Moralis.executeFunction(options);
  };
  const _frTokenTotalBurnt = async ({ contract }) => {
    const options = {
      contractAddress: contract.frTokenStaking.address,
      functionName: "totalSupply",
      abi: contract.frTokenStaking.abi,
    };
    return await Moralis.executeFunction(options);
  };

  const _frzStaked = async ({ contract, account }) => {
    const options = {
      contractAddress: contract.MultiRewards.address,
      functionName: "balanceOf",
      abi: contract.MultiRewards.abi,
      params: {
        account: account,
      },
    };
    return await Moralis.executeFunction(options);
  };
  const _frzTotalStaked = async ({ contract }) => {
    const options = {
      contractAddress: contract.MultiRewards.address,
      functionName: "totalSupply",
      abi: contract.MultiRewards.abi,
    };
    return await Moralis.executeFunction(options);
  };

  const _genericGetTokenReward = async ({ contract, account, rewardTokenAddress }) => {
    const options = {
      contractAddress: contract.address,
      functionName: "earned",
      abi: contract.abi,
      params: {
        account,
        _rewardsToken: rewardTokenAddress,
      },
    };
    try {
      const result = await Moralis.executeFunction(options);
      return result.toString();
    } catch (err) {
      console.error("Failed to fetch reward token: " + rewardTokenAddress);
      console.error(err);
      return null;
    }
  };
  const _getRewardTokens = async ({ contract, account }) => {
    const burnReward = await _genericGetTokenReward({ contract: contract.frTokenStaking, account, rewardTokenAddress: contract.FRZ.address });
    const stakedRewardInFrToken = await _genericGetTokenReward({ contract: contract.MultiRewards, account, rewardTokenAddress: contract.frToken.address });
    const stakedRewardInWrapped = await _genericGetTokenReward({ contract: contract.MultiRewards, account, rewardTokenAddress: wrappedTokenMetadata.tokenAddress });
    const [frTokenSymbol, frzSymbol, wrappedSymbol] = await _getTokenMetadata([
      contract.frToken,
      contract.FRZ,
      { address: wrappedTokenMetadata.tokenAddress, abi: wrappedTokenMetadata.abi },
    ]);
    return [
      {
        amount: burnReward,
        symbol: frzSymbol,
      },
      {
        amount: stakedRewardInFrToken,
        symbol: frTokenSymbol,
      },
      {
        amount: stakedRewardInWrapped,
        symbol: wrappedSymbol,
      },
    ];
  };

  const _getTokenMetadata = async (contracts) => {
    // Do we even need anything other than the symbol field?
    const symbolsTransactions = contracts.map(async (contract) => {
      const options = {
        contractAddress: contract.address,
        functionName: "symbol",
        abi: contract.abi,
      };
      try {
        return await Moralis.executeFunction(options);
      } catch (err) {
        console.error("Failed to fetch token metadata for: " + contract?.address);
        console.error(err);
        return null;
      }
    });

    const symbols = await Promise.allSettled(symbolsTransactions);
    return symbols.map((symbol) => symbol?.value || symbol);
  };

  const getTokenMetadata = async (tokenContracts = [contract.frToken, contract.FRZ, { address: wrappedTokenMetadata.tokenAddress, abi: wrappedTokenMetadata.abi }]) => {
    const symbols = await _getTokenMetadata(tokenContracts);

    return symbols.map((symbol) => ({
      symbol,
    }));
  };

  const getWrappedTokenBalance = async () => _getWrappedTokenBalance({ tokenAddress: wrappedTokenMetadata.tokenAddress });
  const getFrTokenBalance = async () => _frTokenBalance({ contract, account });
  const getFrTokenTotalSupply = async () => _frTokenTotalSupply({ contract, account });
  const getFrzBalance = async () => _frzBalance({ contract, account });
  const getFrzTotalSupply = async () => _frzTotalSupply({ contract, account });
  const getFrTokenBurnt = async () => _frTokenBurnt({ contract, account });
  const getFrTokenTotalBurnt = async () => _frTokenTotalBurnt({ contract, account });
  const getFrzStaked = async () => _frzStaked({ contract, account });
  const getFrzTotalStaked = async () => _frzTotalStaked({ contract, account });
  const getRewardTokens = async () => _getRewardTokens({ contract, account });

  const genericIsTokenAllowed = async ({ spender, tokenAddress }) => {
    const options = {
      chain: chainId,
      owner_address: account,
      spender_address: spender,
      address: tokenAddress,
    };
    const { allowance } = await Web3Api.token.getTokenAllowance(options);
    return isTokenAllowed(allowance);
  };
  const isFrzAllowed = async ({ spender }) => genericIsTokenAllowed({ spender, tokenAddress: contract.FRZ.address });
  const isFrTokenAllowed = async ({ spender }) => genericIsTokenAllowed({ spender, tokenAddress: contract.frToken.address });
  const isWrappedTokenAllowed = async ({ spender }) => genericIsTokenAllowed({ spender, tokenAddress: wrappedTokenMetadata.tokenAddress });

  const genericTokenApproval = async ({
    spender,
    tokenAddress,
    tokenABI,
    spenderParamName = "spender", // TODO we can pull these from the frToken or FRZ abi objects, but is these really going to change?
    amountParamName = "amount",
  }) => {
    const options = {
      contractAddress: tokenAddress,
      functionName: "approve",
      abi: tokenABI,
      params: {
        [spenderParamName]: spender,
        [amountParamName]: "100000000000000000000000000", // TODO check if this is OKAY cross chain, etc.
      },
    };
    return await Moralis.executeFunction(options); // this returns a transaction promise. use await transation.wait() to wait for chain confirmation
  };
  const allowFrz = async ({ spender }) =>
    genericTokenApproval({
      spender,
      tokenAddress: contract.FRZ.address,
      tokenABI: contract.FRZ.abi,
    });
  const allowFrToken = async ({ spender }) =>
    genericTokenApproval({
      spender,
      tokenAddress: contract.frToken.address,
      tokenABI: contract.frToken.abi,
    });
  const allowWrappedToken = async ({ spender }) =>
    genericTokenApproval({
      spender,
      tokenAddress: wrappedTokenMetadata.tokenAddress,
      tokenABI: wrappedTokenMetadata.abi,
      spenderParamName: wrappedTokenMetadata.spenderParamName,
      amountParamName: wrappedTokenMetadata.amountParamName,
    });

  const checkThenAllowFrz = async ({ spender }) => {
    const frzAllowedResult = await isFrzAllowed({ spender });
    if (!frzAllowedResult) {
      const approveFrzTransaction = await allowFrz({ spender });
      return await approveFrzTransaction.wait();
    } else {
      return frzAllowedResult;
    }
  };
  const checkThenAllowFrToken = async ({ spender }) => {
    const frTokenAllowedResult = await isFrTokenAllowed({ spender });
    if (!frTokenAllowedResult) {
      const approveFrTokenTransaction = await allowFrToken({ spender });
      return await approveFrTokenTransaction.wait();
    } else {
      return frTokenAllowedResult;
    }
  };
  const checkThenAllowWrapped = async ({ spender }) => {
    const wrappedTokenAllowedResult = await isWrappedTokenAllowed({ spender });
    if (!wrappedTokenAllowedResult) {
      const approveWrappedTokenTransaction = await allowWrappedToken({
        spender,
      });
      return await approveWrappedTokenTransaction.wait();
    } else {
      return wrappedTokenAllowedResult;
    }
  };

  const refreshTokenData = async () => {
    const fetchAndSetFns = [
      [getFrTokenTotalSupply, setFrTokenTotalSupply],
      [getFrTokenBalance, setFrTokenBalance],
      [getFrzTotalSupply, setFrzTotalSupply],
      [getFrzBalance, setFrzBalance],
      [getWrappedTokenBalance, setWrappedTokenBalance],
      [getFrTokenBurnt, setFrTokenBurnt],
      [getFrTokenTotalBurnt, setFrTokenTotalBurnt],
      [getFrzStaked, setFrzStaked],
      [getFrzTotalStaked, setFrzTotalStaked],
    ];
    const handleFetchError = (err) => {
      console.error(err);
      return null;
    };

    const convertUnits = (inDec18) => {
      return inDec18?.length > 0 ? Moralis.Units.FromWei(inDec18) : null;
    };

    const fetches = fetchAndSetFns.map(([fetchFn]) => {
      return fetchFn()
        .then((result) => result?.toString() || null) // trigger every fetch and convert the result to a string or give up and return null if the result is falsey
        .catch(handleFetchError); // errors return null as well
    });
    const results = await Promise.allSettled(fetches); // wait until all fetches complete or error out
    let rewardTokenResults = await getRewardTokens(); // this one is non-standard
    let tokenMetadataResults = await getTokenMetadata();

    fetchAndSetFns.forEach(([, setFn], index) => setFn(convertUnits(results[index].value))); // set the hook state for each reults

    rewardTokenResults = !rewardTokenResults ? [] : rewardTokenResults.map((rewardTokenResult) => ({ ...rewardTokenResult, amount: convertUnits(rewardTokenResult.amount) }));
    // NOTE: this next line will break if we ever care about more than 3 tokens:
    tokenMetadataResults = {
      frToken: tokenMetadataResults?.[0],
      FRZ: tokenMetadataResults?.[1],
      wrappedToken: tokenMetadataResults?.[2],
    };
    setRewardTokens(rewardTokenResults); // [] indicates failure or no data
    setTokenMetadata(tokenMetadataResults || null);

    if (!isInitialized) {
      setIsInitialized(true); // we have data now!
    }
  };

  return {
    isInitialized, // true indicates that token data has been loaded at least once

    tokenData: {
      frTokenTotalSupply,
      frTokenBalance,
      frzTotalSupply,
      frzBalance,
      wrappedTokenBalance,
      frTokenBurnt,
      frTokenTotalBurnt,
      frzFlowShare,
      frzStaked,
      frzTotalStaked,
      rewardTokens,
      tokenMetadata,
    },

    // these store the last error (if any)
    errors: {
      /** TODO storing errors might not be needed if we throw useful errors and use error boundaries around this hook */
    },

    methods: {
      // use these to refresh the token data
      refreshTokenData, // TODO add whitelist of keys to limit refresh to specific tokens

      // check or set allowance
      isFrzAllowed,
      isFrTokenAllowed,
      isWrappedTokenAllowed,
      allowFrz,
      allowFrToken,
      allowWrappedToken,
      checkThenAllowFrz,
      checkThenAllowFrToken,
      checkThenAllowWrapped,
    },
  };
}

const isTokenAllowed = (allowance) => {
  if (typeof allowance !== "string" || allowance.length <= 0 || !allowance) {
    //if not a string, empty string, or falsey
    throw new Error("Unknown input in isTokenAllowed " + allowance);
  }
  return allowance === "0" ? false : true; //it's not safe to do math on these results as they can exceed JS max integer sizes. if it ain't zero, it's probably fine
};
