# NFT Skulls 2022

## Commands

- Compile: npx hardhat compile
- Deploy: npx hardhat --network rinkeby run scripts/deploy.js
- Clean: npx hardhat clean
- Validate contract on etherscan: npx hardhat verify --network rinkeby 0xcontractAddress
- Generate addresses merkle tree: node ./scripts/generate-addresses-merkel-tree.js

- Update in minting-nft.js
  - contractAddress
  - contractAbi

## Tools

- Byte counter
- Big text: http://patorjk.com/software/taag/#p=display&f=Soft

## Calculate gas cost

- Gas tracker: https://etherscan.io/gastracker
  - Calculate with 140 gwei gas price
- Gwei to Ether: https://eth-converter.com
- Ether to Euro: https://www.google.com/search?q=ethereum+to+eur

## Gas cost

- Deploy contract: 1600€
- Set contract URI: https://rinkeby.etherscan.io/tx/0xd2ebb4f368ca79eb4177130685e7625214c0839774dbbcefa0f143a7e7a26e83
- Set base URI: https://rinkeby.etherscan.io/tx/0xef01ec9ea63e49354438f915d72d5196b429d5f26223fae96dd72503072b4bdb
  or with slash: https://rinkeby.etherscan.io/tx/0x7146e6fdf17439f12b2ce1d6e209264ab3fa4053b808dd1ae4267f5148dbd304
- Unpause sale: https://rinkeby.etherscan.io/tx/0xc427841084a42f32012df2c98582c847f404fdc77eb25cd1b369f0473b801955
- Mint 1 NFT: https://rinkeby.etherscan.io/tx/0xd3e0e1d3d44f952fc841631e66f1b31f79ed8ddcf64279a22a2e1165cdb5f7c5
