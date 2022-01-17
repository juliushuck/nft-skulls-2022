const { MerkleTree } = require("merkletreejs");
const fs = require("fs");
const keccak256 = require("keccak256");

const addresses = require("../inputs/merkel-tree-addresses.json");

const findDuplicates = (array) =>
  array.filter((x, i) => array.indexOf(x) !== i);

const duplicates = findDuplicates(addresses);
if (duplicates.length > 0) {
  fs.writeFileSync(
    "./outputs/addresses-merkle-tree-duplicates.json",
    JSON.stringify(duplicates)
  );
  throw new Error("Duplicate items");
}

const leafNodes = addresses.map((x) => keccak256(x));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

console.log("Root hash:", merkleTree.getRoot().toString("hex"));
// console.log(merkleTree.toString());
