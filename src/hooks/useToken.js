import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";

export default function useToken({ contract }) {
  const { isInitialized: isMoralisInitialized, account } = useMoralis();

  const [isInitialized, setIsInitialized] = useState(false);
  const [frTokenTotalSupply, setFrTokenTotalSupply] = useState(""); // keep BigNumbers as strings in javascript to avoid rounding errors due to differences between JS and ethereum
  const [frTokenAllowance, setFrTokenAllowance] = useState("");
  const [frTokenBalance, setFrTokenBalance] = useState("");
  const [frzTotalSupply, setFrzTotalSupply] = useState("");
  const [frzAllowance, setFrzAllowance] = useState("");
  const [frzBalance, setFrzBalance] = useState("");
  const [wrappedTokenAllowance, setWrappedTokenAllowance] = useState(""); // TODO might not need this one

  const { getFrTokenTotalSupply, frTokenTotalSupplyError } =
    _frTokenTotalSupply({ contract, account });
  const { getFrTokenAllowance, frTokenAllowanceError } = _frTokenAllowance({
    contract,
    account,
  });
  const { getFrTokenBalance, frTokenBalanceError } = _frTokenBalance({
    contract,
    account,
  });
  const { getFrzTotalSupply, frzTotalSupplyError } = _frzTotalSupply({
    contract,
    account,
  });
  const { getFrzAllowance, frzAllowanceError } = _frzAllowance({
    contract,
    account,
  });
  const { getFrzBalance, frzBalanceError } = _frzBalance({ contract, account });
  const { getWrappedTokenAllowance, wrappedTokenAllowanceError } =
    _wrappedTokenAllowance({ contract, account });

  const isFrzAllowed = () => frzAllowance > 0;
  const isFrTokenAllowed = () => frTokenAllowance > 0;
  const isWrappedTokenAllowed = () => false; // TODO
  const allowFrz = _allowFrz();
  const allowFrToken = _allowFrToken();
  const allowWrappedToken = _allowWrappedToken();

  // TODO add approveFRZ, ...FrToken, ...Wrapped

  useEffect(() => {
    if (isMoralisInitialized) {
      asyncEffect();
    }

    async function asyncEffect() {
      const fetchAndSetFns = [
        [getFrTokenTotalSupply, setFrTokenTotalSupply],
        [getFrTokenAllowance, setFrTokenAllowance],
        [getFrTokenBalance, setFrTokenBalance],
        [getFrzTotalSupply, setFrzTotalSupply],
        [getFrzAllowance, setFrzAllowance],
        [getFrzBalance, setFrzBalance],
        [getWrappedTokenAllowance, setWrappedTokenAllowance],
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
      setIsInitialized(true);
    }
  }, [isMoralisInitialized, contract]);

  return {
    isInitialized, // true indicates that token data has been loaded at least once

    tokenData: {
      frTokenTotalSupply,
      frTokenAllowance,
      frTokenBalance,
      frzTotalSupply,
      frzAllowance,
      frzBalance,
      wrappedTokenAllowance,
    },

    // these store the last error (if any)
    errors: {
      frTokenTotalSupplyError,
      frTokenAllowanceError,
      frTokenBalanceError,
      frzTotalSupplyError,
      frzAllowanceError,
      frzBalanceError,
      wrappedTokenAllowanceError,
    },

    methods: {
      // use these to refresh the token data
      getFrTokenTotalSupply,
      getFrTokenAllowance,
      getFrTokenBalance,
      getFrzTotalSupply,
      getFrzAllowance,
      getFrzBalance,
      getWrappedTokenAllowance,

      // check or set allowance
      isFrzAllowed,
      isFrTokenAllowed,
      isWrappedTokenAllowed,
      allowFrz,
      allowFrToken,
      allowWrappedToken,
    },
  };
}

// these are pulled out as private helper functions purely for code readability
const _allowFrz = () => {
  return () => {
    throw new Error("Not implemented ");
  };
};
const _allowFrToken = () => {
  return () => {
    throw new Error("Not implemented ");
  };
};
const _allowWrappedToken = () => {
  return () => {
    throw new Error("Not implemented ");
  };
};

const _frTokenTotalSupply = ({ contract }) => {
  let {
    runContractFunction: getFrTokenTotalSupply,
    error: frTokenTotalSupplyError,
  } = useWeb3Contract({
    abi: contract.frToken.abi,
    contractAddress: contract.frToken.address,
    functionName: "totalSupply",
  });
  frTokenTotalSupplyError = sanitizeTokenError(frTokenTotalSupplyError);
  return { getFrTokenTotalSupply, frTokenTotalSupplyError };
};

const _frTokenAllowance = ({ contract, account }) => {
  let {
    runContractFunction: getFrTokenAllowance,
    error: frTokenAllowanceError,
  } = useWeb3Contract({
    abi: contract.frToken.abi,
    contractAddress: contract.frToken.address,
    functionName: "allowance",
    params: {
      owner: account,
      spender: contract.TrueFreezeGovernor.address,
    },
  });
  frTokenAllowanceError = sanitizeTokenError(frTokenAllowanceError);
  return { getFrTokenAllowance, frTokenAllowanceError };
};
const _frTokenBalance = ({ contract, account }) => {
  let { runContractFunction: getFrTokenBalance, error: frTokenBalanceError } =
    useWeb3Contract({
      abi: contract.frToken.abi,
      contractAddress: contract.frToken.address,
      functionName: "balanceOf",
      params: {
        account: account,
      },
    });
  frTokenBalanceError = sanitizeTokenError(frTokenBalanceError);
  return { getFrTokenBalance, frTokenBalanceError };
};
const _frzTotalSupply = ({ contract }) => {
  let { runContractFunction: getFrzTotalSupply, error: frzTotalSupplyError } =
    useWeb3Contract({
      abi: contract.FRZ.abi,
      contractAddress: contract.FRZ.address,
      functionName: "totalSupply",
    });
  frzTotalSupplyError = sanitizeTokenError(frzTotalSupplyError);
  return { getFrzTotalSupply, frzTotalSupplyError };
};
const _frzAllowance = ({ contract, account }) => {
  let { runContractFunction: getFrzAllowance, error: frzAllowanceError } =
    useWeb3Contract({
      abi: contract.FRZ.abi,
      contractAddress: contract.FRZ.address,
      functionName: "allowance",
      params: {
        owner: account,
        spender: contract.TrueFreezeGovernor.address,
      },
    });
  frzAllowanceError = sanitizeTokenError(frzAllowanceError);
  return { getFrzAllowance, frzAllowanceError };
};
const _frzBalance = ({ contract, account }) => {
  let { runContractFunction: getFrzBalance, error: frzBalanceError } =
    useWeb3Contract({
      abi: contract.FRZ.abi,
      contractAddress: contract.FRZ.address,
      functionName: "balanceOf",
      params: {
        account: account,
      },
    });
  frzBalanceError = sanitizeTokenError(frzBalanceError);
  return { getFrzBalance, frzBalanceError };
};
const _wrappedTokenAllowance = (/*{ contract, account }*/) => {
  // TODO
  return {
    getWrappedTokenAllowance: async () => null,
    getWrappedTokenAllowanceError: "todo",
  };
};

function sanitizeTokenError(error) {
  // converts the error to a string that can be embedded in the DOM
  if (error) {
    return JSON.stringify(error) + "";
  }
  return error;
}
