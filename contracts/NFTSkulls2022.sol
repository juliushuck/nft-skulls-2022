// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFTSkulls2022 is ERC721, ERC721Enumerable, Ownable {
    using SafeMath for uint256;

    uint256 public constant MAX_TOKEN_COUNT = 6;

    string public baseUri =
        "ipfs://QmU55S2L6XyDyYCf54z9iXMrn9t3kXsqKLUmQTAd8uNpKX/";
    bool public isSaleActive = false;
    uint256 public mintPrice = 0.001 ether;
    uint256 public maxTokenCountPerTx = 2;

    constructor() ERC721("NFTSkulls2022", "NFTS2022") {}

    modifier checkIsSaleActive() {
        require(isSaleActive, "Sale is not active");
        _;
    }

    function setBaseUri(string memory newBaseUri) external onlyOwner {
        baseUri = newBaseUri;
    }

    function pauseSale() external onlyOwner {
        isSaleActive = false;
    }

    function unpauseSale() external onlyOwner {
        isSaleActive = true;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function setMaxTokenCountPerTx(uint256 newMaxTokenCountPerTx)
        external
        onlyOwner
    {
        maxTokenCountPerTx = newMaxTokenCountPerTx;
    }

    function reserveTokens(address to, uint256 amount) external onlyOwner {
        for (uint256 i = 1; i <= amount; i++) {
            _safeMint(to, totalSupply());
        }
    }

    function safeMint(address to, uint256 amount)
        public
        payable
        checkIsSaleActive
    {
        require(
            amount > 0 && amount <= maxTokenCountPerTx,
            "Amount of tokens exceeds max tokens per transaction"
        );
        require(
            amount + totalSupply() <= MAX_TOKEN_COUNT,
            "Not enought tokens left to buy"
        );
        require(
            msg.value >= mintPrice * amount,
            "Amount of ether sent is not enough"
        );

        for (uint256 i = 0; i < amount; i++) {
            _safeMint(to, totalSupply());
        }
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(
            address(this).balance >= amount,
            "Not enought ether to withdraw"
        );
        Address.sendValue(payable(msg.sender), amount);
    }

    function _baseURI() internal view override(ERC721) returns (string memory) {
        return baseUri;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
