// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTSkulls2022 is ERC721, Ownable {
    using Counters for Counters.Counter;

    uint256 public constant MAX_TOKEN_COUNT = 6;
    uint256 public constant MAX_TOKEN_COUNT_PER_TX = 2;
    uint256 public constant MINT_PRICE = 0.001 ether;

    string private _contractUri;
    string private _baseUri =
        "ipfs://QmU55S2L6XyDyYCf54z9iXMrn9t3kXsqKLUmQTAd8uNpKX/";
    Counters.Counter private _tokenIdCounter;

    bool public isSaleActive = false;
    mapping(address => uint256) public freeMintingAddresses;

    constructor() ERC721("NFTSkulls2022", "NFTS2022") {}

    // Modifiers

    modifier onlyUser() {
        require(tx.origin == msg.sender, "Only users");
        _;
    }

    modifier precheckIsSaleActive() {
        require(isSaleActive, "Sale is not active");
        _;
    }

    modifier onlyFreeMintingAddresses() {
        require(
            freeMintingAddresses[msg.sender] > 0,
            "Only free miniting addresses"
        );
        _;
    }

    // Helpers

    function refundIfOver(uint256 price) private {
        require(msg.value >= price, "Too less ether sent");
        if (msg.value > price) {
            Address.sendValue(payable(msg.sender), msg.value - price);
        }
    }

    // Config setters

    function setContractUri(string memory newContractUri) external onlyOwner {
        _contractUri = newContractUri;
    }

    function setBaseUri(string memory newBaseUri) external onlyOwner {
        _baseUri = newBaseUri;
    }

    function setIsSaleActive(bool newIsSaleActive) external onlyOwner {
        isSaleActive = newIsSaleActive;
    }

    function seedFreeMintingAddresses(
        address[] memory addresses,
        uint256[] memory freeMintsCount
    ) external onlyOwner {
        require(
            addresses.length == freeMintsCount.length,
            "Lengths do not match"
        );
        for (uint256 i = 0; i < addresses.length; i++) {
            freeMintingAddresses[addresses[i]] = freeMintsCount[i];
        }
    }

    // Minting

    function reserveTokens(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            _tokenIdCounter.current() + amount <= MAX_TOKEN_COUNT,
            "Too less tokens left to mint"
        );
        for (uint256 i = 1; i <= amount; i++) {
            _tokenIdCounter.increment();
            _safeMint(to, _tokenIdCounter.current() - 1);
        }
    }

    function mint(address to, uint256 amount)
        external
        payable
        onlyUser
        precheckIsSaleActive
    {
        require(
            amount > 0 && amount <= MAX_TOKEN_COUNT_PER_TX,
            "Amount exceeds max tokens per tx"
        );
        require(
            _tokenIdCounter.current() + amount <= MAX_TOKEN_COUNT,
            "Too less tokens left to mint"
        );
        uint256 price = amount * MINT_PRICE;
        require(msg.value >= price, "Too less ether sent");
        for (uint256 i = 0; i < amount; i++) {
            _tokenIdCounter.increment();
            _safeMint(to, _tokenIdCounter.current() - 1);
        }
        refundIfOver(price);
    }

    function mintFree(uint256 amount)
        external
        onlyUser
        onlyFreeMintingAddresses
        precheckIsSaleActive
    {
        require(
            amount > 0 && amount <= freeMintingAddresses[msg.sender],
            "Amount exceeds your free mints"
        );
        require(
            _tokenIdCounter.current() + amount <= MAX_TOKEN_COUNT,
            "Too less tokens left to mint"
        );
        freeMintingAddresses[msg.sender] -= amount;
        _tokenIdCounter.increment();
        _safeMint(msg.sender, _tokenIdCounter.current() - 1);
    }

    // Other

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        Address.sendValue(to, amount);
    }

    // Uris

    function contractURI() public view returns (string memory) {
        return _contractUri;
    }

    function _baseURI() internal view override(ERC721) returns (string memory) {
        return _baseUri;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(_baseUri, Strings.toString(tokenId), ".json")
            );
    }
}
