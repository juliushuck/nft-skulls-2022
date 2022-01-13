require("dotenv").config();
const { ALCHEMY_API_URL, WALLET_PRIVATE_KEY, WALLET_PUBLIC_KEY } = process.env;
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(ALCHEMY_API_URL);
const contract = require("../artifacts/contracts/NFTSkulls2020.sol/NFTSkulls2020.json");
const contractAddress = "0x049512DE8Ea6F3E940b605A1aC995cc63057ad33";
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

async function mintNFT(tokenURI) {
  const nonce = await web3.eth.getTransactionCount(WALLET_PUBLIC_KEY, "latest"); //get latest nonce
  const tx = {
    from: WALLET_PUBLIC_KEY,
    to: contractAddress,
    nonce: nonce,
    gas: 500000,
    data: nftContract.methods.mintNFT(WALLET_PUBLIC_KEY, tokenURI).encodeABI(),
  };
  const signPromise = web3.eth.accounts.signTransaction(tx, WALLET_PRIVATE_KEY);
  signPromise
    .then((signedTx) => {
      web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
        function (err, hash) {
          if (!err) {
            console.log(
              "The hash of your transaction is: ",
              hash,
              "\nCheck Alchemy's Mempool to view the status of your transaction!"
            );
          } else {
            console.log(
              "Something went wrong when submitting your transaction:",
              err
            );
          }
        }
      );
    })
    .catch((err) => {
      console.log(" Promise failed:", err);
    });
}

mintNFT("ipfs://QmQbXKaVHz3wNAVdDxq6DmxMRroYv1jf9sr6SoaDnorcNK");
