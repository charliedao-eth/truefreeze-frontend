import React, { useState, useEffect } from "react";
import { useMoralis, useNFTBalances } from "react-moralis";
import { Button, Card, Image, Tooltip, Modal, Input, Skeleton, message } from "antd";
import { FileSearchOutlined, SendOutlined } from "@ant-design/icons";
import { getExplorer } from "helpers/networks";
import AddressInput from "./AddressInput";
import { useVerifyMetadata } from "hooks/useVerifyMetadata";

const styles = {
  NFTs: {
    display: "flex",
    flexWrap: "wrap",
    WebkitBoxPack: "start",
    justifyContent: "flex-start",
    margin: "0 auto",
    maxWidth: "1000px",
    width: "100%",
    gap: "10px",
  },
};

function NFTBalance({
  filterByContractAddress = "",
  fetchProgress,
  unlockFreezer,
  className = "",
}) {
  filterByContractAddress = filterByContractAddress?.toLowerCase();

  const { data: NFTBalances } = useNFTBalances();
  const { Moralis, chainId } = useMoralis();
  const [visible, setVisibility] = useState(false);
  const [receiverToSend, setReceiver] = useState(null);
  const [amountToSend, setAmount] = useState(null);
  const [nftToSend, setNftToSend] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [freezers, setFreezers] = useState(null);
  const [unlockProgress, setUnlockProgress] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState({});
  const { verifyMetadata } = useVerifyMetadata();

  useEffect(() => {
    if (NFTBalances?.result && NFTBalances.result) {
      const freezerResults = NFTBalances.result
        .filter((nft) =>
          !filterByContractAddress
            ? true
            : nft.token_address.toLowerCase() === filterByContractAddress,
        )
        .map((nft) => verifyMetadata(nft));
      setFreezers([...freezerResults]);
    }
  }, [NFTBalances?.result, filterByContractAddress]);

  useEffect(() => {
    if (freezers && freezers.length > 0) {
      (async () => {
        const progressAmounts = await Promise.allSettled(
          freezers.map(fetchProgress),
        );
        const progressByTokenId = progressAmounts.reduce(
          (mapping, progressAmount, index) => {
            const freezer = freezers[index];
            const tokenId = freezer.token_id.toString();
            mapping[tokenId] = progressAmount;
            return mapping;
          },
          {},
        );
        setUnlockProgress(progressByTokenId);
      })();
    }
  }, [freezers, fetchProgress]);

  async function transfer(nft, amount, receiver) {
    console.log(nft, amount, receiver);
    const options = {
      type: nft?.contract_type?.toLowerCase(),
      tokenId: nft?.token_id,
      receiver,
      contractAddress: nft?.token_address,
    };

    if (options.type === "erc1155") {
      options.amount = amount ?? nft.amount;
    }

    setIsPending(true);

    try {
      const tx = await Moralis.transfer(options);
      console.log(tx);
      setIsPending(false);
    } catch (e) {
      alert(e.message);
      setIsPending(false);
    }
  }

  const handleTransferClick = (nft) => {
    setNftToSend(nft);
    setVisibility(true);
  };

  const handleChange = (e) => {
    setAmount(e.target.value);
  };

  const startUnlock = async (nft) => {
    setIsUnlocking({
      ...isUnlocking,
      [nft?.token_id]: true,
    }); // tracks multiple freezers unlocking at the same time

    try {
      const unlockSuccess = (await unlockFreezer(nft)) !== 'error';
      if(unlockSuccess) {
        message.success(`Freezer unlocked successfully`, 3);
        window.localStorage.setItem(`freezer_${nft.token_id}`, 'unlocked');
      }
    } finally {
      setIsUnlocking({
        ...isUnlocking,
        [nft?.token_id]: false,
      });
    }
  }

  // TODO useEffect to fetch getProgress, getUnlockCost
  // TODO withdrawWAsset (unlock and pay fees in one step) <-- needs user clarity

  const renderNFT = (nft, keyname) => {
    const progressAmount = unlockProgress?.[nft.token_id]?.value; // fancy way to say "access all these props/functions but return undefined if any are missing"

    return (
      <Card
        hoverable
        actions={[
          <Tooltip title="View On Blockexplorer">
            <FileSearchOutlined
              onClick={() =>
                window.open(
                  `${getExplorer(chainId)}address/${nft.token_address}`,
                  "_blank",
                )
              }
            />
          </Tooltip>,
          <Tooltip title="Transfer NFT">
            <SendOutlined onClick={() => handleTransferClick(nft)} />
          </Tooltip>,
        ]}
        style={{ width: 240, border: "2px solid #e7eaf3" }}
        cover={
          <Image
            preview={false}
            src={nft?.image || "error"}
            fallback="data:image/png;base64,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"
            alt=""
            style={{ height: "300px" }}
          />
        }
        key={keyname}
        className={
          (window.localStorage.getItem(`freezer_${nft.token_id}`) === 'unlocked') ? 'hide-nft' : '' 
        }
      >
        {!nft ? null : (
          <Button
            className="redeem-freezer"
            title={(progressAmount || "--") + "% progress"}
            onClick={() => startUnlock(nft)}
            disabled={isUnlocking[nft.token_id]}
          >
            <span className="redeem-text">
              <span>{isUnlocking[nft.token_id] ? 'REDEEMING' :'REDEEM'}</span>
            </span>
            {progressAmount ? (
              <span
                style={{ width: Math.min(+progressAmount, 101) + "%" }}
                className="progress-gradient"
                title={progressAmount + "% progress"}
              >
                &nbsp;
              </span>
            ) : null}
          </Button>
        )}
      </Card>
    );
  };

  const renderNFTs = (nfts) => {
    if (!nfts || nfts.length <= 0) {
      return null;
    }

    const renderedNFTs = freezers.map((nft, index) =>
      renderNFT(nft, "freezer-" + index),
    );
    return renderedNFTs;
  };

  return (
    <div className={className} style={{ padding: "15px", maxWidth: "1030px", width: "100%" }}>
      <div style={styles.NFTs}>
        <Skeleton loading={!freezers}>{renderNFTs(freezers)}</Skeleton>
      </div>
      <Modal
        title={`Transfer ${nftToSend?.name || "NFT"}`}
        visible={visible}
        onCancel={() => setVisibility(false)}
        onOk={() => transfer(nftToSend, amountToSend, receiverToSend)}
        confirmLoading={isPending}
        okText="Send"
      >
        <AddressInput autoFocus placeholder="Receiver" onChange={setReceiver} />
        {nftToSend && nftToSend.contract_type === "erc1155" && (
          <Input
            placeholder="amount to send"
            onChange={(e) => handleChange(e)}
          />
        )}
      </Modal>
    </div>
  );
}

export default NFTBalance;
