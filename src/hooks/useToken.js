import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract, useMoralisWeb3Api } from "react-moralis";
import { getWrappedNative, getWrappedABI } from "helpers/networks";

export default function useToken({ contract }) {
  const {
    isInitialized: isMoralisInitialized,
    account,
    chainId,
    Moralis,
  } = useMoralis();
  const Web3Api = useMoralisWeb3Api();

  const [isInitialized, setIsInitialized] = useState(false);
  const [frTokenTotalSupply, setFrTokenTotalSupply] = useState(""); // keep BigNumbers as strings in javascript to avoid rounding errors due to differences between JS and ethereum
  const [frTokenBalance, setFrTokenBalance] = useState("");
  const [frzTotalSupply, setFrzTotalSupply] = useState("");
  const [frzBalance, setFrzBalance] = useState("");

  // TODO use FRZ and frToken contract getters to fetch token metadata, then use that metadata to add our custom tokens to their wallet token list like so:
  // https://docs.metamask.io/guide/registering-your-token.html

  const { getFrTokenTotalSupply, frTokenTotalSupplyError } =
    _frTokenTotalSupply({ contract, account });

  const { getFrTokenBalance, frTokenBalanceError } = _frTokenBalance({
    contract,
    account,
  });
  const { getFrzTotalSupply, frzTotalSupplyError } = _frzTotalSupply({
    contract,
    account,
  });
  const { getFrzBalance, frzBalanceError } = _frzBalance({ contract, account });

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
  const wrappedTokenMetadata = getWrappedABI(chainId);
  const isFrzAllowed = async ({ spender }) =>
    genericIsTokenAllowed({ spender, tokenAddress: contract.FRZ.address });
  const isFrTokenAllowed = async ({ spender }) =>
    genericIsTokenAllowed({ spender, tokenAddress: contract.frToken.address });
  const isWrappedTokenAllowed = async ({ spender }) =>
    genericIsTokenAllowed({ spender, tokenAddress: getWrappedNative(chainId) });

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
      tokenAddress: getWrappedNative(chainId),
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
  }
  const checkThenAllowFrToken = async ({ spender }) => {
    const frTokenAllowedResult = await isFrTokenAllowed({ spender });
    if (!frTokenAllowedResult) {
      const approveFrTokenTransaction = await allowFrToken({ spender });
      return await approveFrTokenTransaction.wait();
    } else {
      return frTokenAllowedResult;
    }
  }
  const checkThenAllowWrapped = async ({ spender }) => {
    const wrappedTokenAllowedResult = await isWrappedTokenAllowed({ spender });
    if (!wrappedTokenAllowedResult) {
      const approveWrappedTokenTransaction = await allowWrappedToken({ spender });
      return await approveWrappedTokenTransaction.wait();
    } else {
      return wrappedTokenAllowedResult;
    }
  }

  const refreshTokenData = async () => {
    const fetchAndSetFns = [
      [getFrTokenTotalSupply, setFrTokenTotalSupply],
      [getFrTokenBalance, setFrTokenBalance],
      [getFrzTotalSupply, setFrzTotalSupply],
      [getFrzBalance, setFrzBalance],
    ];
    const handleFetchError = (err) => {
      console.error(err);
      return null;
    };

    const fetches = fetchAndSetFns.map(([fetchFn]) => {
      return fetchFn()
        .then((result) => result?.toString() || null) // trigger every fetch and convert the result to a string or give up and return null if the result is falsey
        .catch(handleFetchError); // errors return null as well
    });
    const results = await Promise.allSettled(fetches); // wait until all fetches complete or error out

    fetchAndSetFns.forEach(([, setFn], index) => setFn(results[index].value)); // set the hook state for each reults
  };

  useEffect(() => {
    if (isMoralisInitialized) {
      (async () => {
        await refreshTokenData();
        setIsInitialized(true);
      })();
    }
  }, [isMoralisInitialized, contract]);

  return {
    isInitialized, // true indicates that token data has been loaded at least once

    tokenData: {
      frTokenTotalSupply,
      frTokenBalance,
      frzTotalSupply,
      frzBalance,
    },

    // these store the last error (if any)
    errors: {
      frTokenTotalSupplyError,
      frTokenBalanceError,
      frzTotalSupplyError,
      frzBalanceError,
    },

    methods: {
      // use these to refresh the token data
      refreshTokenData,

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

// these are pulled out as private helper functions purely for code readability

const _frTokenTotalSupply = ({ contract }) => {
  let {
    runContractFunction: getFrTokenTotalSupply,
    error: frTokenTotalSupplyError,
  } = useWeb3Contract({
    abi: contract.frToken.abi,
    contractAddress: contract.frToken.address,
    functionName: "totalSupply",
  });
  return { getFrTokenTotalSupply, frTokenTotalSupplyError };
};

const _frTokenBalance = ({ contract, account }) => {
  const { runContractFunction: getFrTokenBalance, error: frTokenBalanceError } =
    useWeb3Contract({
      abi: contract.frToken.abi,
      contractAddress: contract.frToken.address,
      functionName: "balanceOf",
      params: {
        account: account,
      },
    });
  return { getFrTokenBalance, frTokenBalanceError };
};
const _frzTotalSupply = ({ contract }) => {
  const { runContractFunction: getFrzTotalSupply, error: frzTotalSupplyError } =
    useWeb3Contract({
      abi: contract.FRZ.abi,
      contractAddress: contract.FRZ.address,
      functionName: "totalSupply",
    });
  return { getFrzTotalSupply, frzTotalSupplyError };
};
/*const _frzAllowance = ({ contract, account }) => {
  const { runContractFunction: getFrzAllowance, error: frzAllowanceError } =
    useWeb3Contract({
      abi: contract.FRZ.abi,
      contractAddress: contract.FRZ.address,
      functionName: "allowance",
      params: {
        owner: account,
        spender: contract.TrueFreezeGovernor.address,
      },
    });
  return { getFrzAllowance, frzAllowanceError };
};*/
const _frzBalance = ({ contract, account }) => {
  const { runContractFunction: getFrzBalance, error: frzBalanceError } =
    useWeb3Contract({
      abi: contract.FRZ.abi,
      contractAddress: contract.FRZ.address,
      functionName: "balanceOf",
      params: {
        account: account,
      },
    });
  return { getFrzBalance, frzBalanceError };
};
/*const _wrappedTokenAllowance = ({ contract, account }) => {
  // TODO
  return {
    getWrappedTokenAllowance: async () => null,
    getWrappedTokenAllowanceError: "todo",
  };
};*/

const isTokenAllowed = (allowance) => {
  if (typeof allowance !== "string" || allowance.length <= 0 || !allowance) {
    //if not a string, empty string, or falsey
    throw new Error("Unknown input in isTokenAllowed " + allowance);
  }
  return allowance === "0" ? false : true; //it's not safe to do math on these results as they can exceed JS max integer sizes. if it ain't zero, it's probably fine
};
