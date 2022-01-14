let provider;
let signer;
let showConnectWallet;
let shouldShowConnectWallet = false;
let showMintNft;
let shouldShowMintNft = false;
let showErr;
let errMsgToShow;
let hasTriedToConnect = false;

const convertToUrl = (ipfsUri) => {
  return "https://gateway.pinata.cloud/ipfs/" + ipfsUri.substring(7);
};

window.ethereum.addListener("connect", async (res) => {
  if (Number(res.chainId) !== 4) {
    if (showErr === undefined) {
      errMsgToShow = "Please connect to the Rinkeby testnet";
    } else {
      showErr("Please connect to the Rinkeby testnet");
    }
    hasTriedToConnect = true;
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
  account = (await provider.listAccounts())[0];
  if (account === undefined) {
    if (showConnectWallet === undefined) {
      shouldShowConnectWallet = true;
    } else {
      showConnectWallet();
    }
    return;
  }
  if (showMintNft === undefined) {
    shouldShowMintNft = true;
  } else {
    showMintNft();
  }
  hasTriedToConnect = true;
});

window.ethereum.on("accountsChanged", () => {
  window.location.reload();
});

window.ethereum.on("chainChanged", () => {
  window.location.reload();
});

window.ethereum.on("disconnect", () => {
  window.location.reload();
});

$(document).ready(async () => {
  const connectWalletSection = $(".connect-wallet__section");
  const connectWalletButton = $(".connect-wallet__section .btn");

  const mintNftSection = $(".mint-nft__section");
  const mintNftForm = $(".mint-nft__form");
  const mintNftAmountTextField = $(".mint-nft__form input[name='amount']");
  const mintNftBtn = $(".mint-nft__form a");

  const processingSection = $(".processing__section");
  const processingMsg = $(".processing__msg");

  const errSection = $(".err__section");
  const errMsg = $(".err__msg");

  const successSection = $(".success__section");
  const successNftImg = $(".success__nft-img");

  connectWalletSection.hide();
  mintNftSection.hide();
  processingSection.hide();
  errSection.hide();
  successSection.hide();

  showConnectWallet = () => {
    mintNftSection.hide();
    processingSection.hide();
    errSection.hide();
    successSection.hide();
    connectWalletSection.show();
  };

  showMintNft = () => {
    connectWalletSection.hide();
    processingSection.hide();
    errSection.hide();
    successSection.hide();
    mintNftSection.show();
  };

  const showProcessing = (msg) => {
    connectWalletSection.hide();
    mintNftSection.hide();
    errSection.hide();
    successSection.hide();
    processingMsg.text(msg);
    processingSection.show();
  };

  const showSuccess = () => {
    connectWalletSection.hide();
    mintNftSection.hide();
    processingSection.hide();
    errSection.hide();
    successSection.show();
  };

  showErr = (msg) => {
    connectWalletSection.hide();
    mintNftSection.hide();
    processingSection.hide();
    successSection.hide();
    errMsg.text(msg);
    errSection.show();
  };

  connectWalletButton.click(async () => {
    window.ethereum.request({ method: "eth_requestAccounts" });
  });

  mintNftForm.submit(async (event) => {
    event.preventDefault();
  });

  mintNftBtn.click(async (event) => {
    event.preventDefault();
    try {
      const amountString = mintNftAmountTextField.val();
      const amount = Number.isNaN(amountString)
        ? undefined
        : Number(amountString);
      if (amount === undefined || amount <= 0) {
        alert("Please enter a valid amount");
        return;
      }
      processingSection.show("Gethering details...");
      const contract = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );
      const mintPrice = await contract.mintPrice();
      const signerAddress = await signer.getAddress();
      const signerNonce = await signer.getTransactionCount();
      showProcessing("Please sign the transaction");
      const tx = await contract.safeMint(signerAddress, amount, {
        value: amount * mintPrice,
        nonce: signerNonce,
      });
      showProcessing("Minting NFT...");
      const txResult = await tx.wait();
      showSuccess();
      const tokenUri = await contract.tokenURI(
        Number(txResult.events[0].args[2])
      );
      const metadata = await (await fetch(convertToUrl(tokenUri))).json();
      successNftImg.attr("src", convertToUrl(metadata.image));
    } catch (err) {
      console.log(JSON.stringify(err));
      let errMsg;
      if (err?.error?.message !== undefined) {
        errMsg = err.error.message;
      } else if (err?.reason !== undefined) {
        console.log(err.reason);
        errMsg = err.reason;
      } else if (err?.message !== undefined) {
        errMsg = err.message;
      } else {
        errMsg = "Unknown error";
      }
      showErr(
        "An error occurred: " +
          errMsg +
          " (See the browser console for more details)"
      );
    }
  });

  if (shouldShowConnectWallet === true) {
    showConnectWallet();
    return;
  }
  if (shouldShowMintNft === true) {
    showMintNft();
    return;
  }
  if (errMsgToShow !== undefined) {
    showErr(errMsgToShow);
    return;
  }
  if (window.ethereum === undefined) {
    showErr("Please install MetaMask");
    return;
  }
  if (hasTriedToConnect === true) {
    showConnectWallet();
  }
});

const contractAddress = "0x5B73ef43644880c7d076959995eB3A125e5C200A";
const contractAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "string",
        name: "tokenURI",
        type: "string",
      },
    ],
    name: "mintNFT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
