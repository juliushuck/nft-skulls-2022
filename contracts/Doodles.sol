// SPDX-License-Identifier: ISC
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// ,------.                   ,--.,--.
// |  .-.  \  ,---.  ,---.  ,-|  ||  | ,---.  ,---.
// |  |  \  :| .-. || .-. |' .-. ||  || .-. :(  .-'
// |  '--'  /' '-' '' '-' '\ `-' ||  |\   --..-'  `)
// `-------'  `---'  `---'  `---' `--' `----'`----'

contract Doodles is ERC721, Ownable {
    using Counters for Counters.Counter;

    uint256 public constant MAX_TOKEN_COUNT = 6;
    uint256 public constant MAX_TOKEN_COUNT_PER_TX = 2;
    uint256 public constant MINT_PRICE = 0.001 ether;

    string private _contractUri = "ipfs://TODO";
    string private _notRevealedImgUri = "ipfs://TODO";
    string private _baseUri;
    Counters.Counter private _tokenIdCounter;

    string public provenanceHash = "";
    bool public isProvenanceHashLocked = false;
    mapping(address => uint256) public freeMintingAddresses;
    bool public isSaleActive = false;
    uint256 public startingIndexBlock;
    uint256 public startingIndex;

    constructor() ERC721("Doodles", "Doodles") {}

    // Modifiers

    modifier onlyUser() {
        require(tx.origin == msg.sender, "Only users");
        _;
    }

    modifier precheckSaleIsActive() {
        require(isSaleActive, "Sale is not active");
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

    function setNotRevealedImgUri(string memory newNotRevealedImgUri)
        external
        onlyOwner
    {
        _notRevealedImgUri = newNotRevealedImgUri;
    }

    function setProvenanceHash(string memory newProvenanceHash)
        external
        onlyOwner
    {
        require(!isProvenanceHashLocked, "Provenance hash is locked");
        provenanceHash = newProvenanceHash;
    }

    function lockProvenanceHash() external onlyOwner {
        isProvenanceHashLocked = true;
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

    function startSale() external onlyOwner {
        isSaleActive = true;
    }

    function endSale() external onlyOwner {
        isSaleActive = false;
    }

    function reveal(string memory newBaseUri) external onlyOwner {
        _baseUri = newBaseUri;
    }

    // Minting

    function reserveTokens(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            _tokenIdCounter.current() + amount <= MAX_TOKEN_COUNT,
            "Too less tokens left"
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
        precheckSaleIsActive
    {
        require(
            amount > 0 && amount <= MAX_TOKEN_COUNT_PER_TX,
            "Amount exceeds max token count per tx"
        );
        require(
            _tokenIdCounter.current() + amount <= MAX_TOKEN_COUNT,
            "Too less tokens left"
        );
        uint256 price = amount * MINT_PRICE;
        require(msg.value >= price, "Too less ether sent");
        for (uint256 i = 0; i < amount; i++) {
            _tokenIdCounter.increment();
            _safeMint(to, _tokenIdCounter.current() - 1);
        }
        refundIfOver(price);
        if (
            startingIndexBlock == 0 &&
            (_tokenIdCounter.current() == MAX_TOKEN_COUNT ||
                block.timestamp >= REVEAL_TIMESTAMP)
        ) {
            // Haven't set the starting index and this is either the last saleable token or the first token to be sold after the end of pre-sale, set the starting index block
            startingIndexBlock = block.number;
        }
    }

    function mintFree(uint256 amount) external onlyUser precheckSaleIsActive {
        require(
            amount > 0 && amount <= freeMintingAddresses[msg.sender],
            "Amount exceeds your free mints"
        );
        require(
            _tokenIdCounter.current() + amount <= MAX_TOKEN_COUNT,
            "Too less tokens left"
        );
        freeMintingAddresses[msg.sender] -= amount;
        _tokenIdCounter.increment();
        _safeMint(msg.sender, _tokenIdCounter.current() - 1);
    }

    // Starting index

    function setStartingIndex() public {
        require(startingIndex == 0, "Starting index already set");
        require(startingIndexBlock != 0, "Starting index block not set");
        startingIndex =
            uint256(blockhash(startingIndexBlock)) %
            MAX_TOKEN_COUNT;
        if (block.number.sub(startingIndexBlock) > 255) {
            // Function got called late (EVM only stores last 256 block hashes)
            startingIndex =
                uint256(blockhash(block.number - 1)) %
                MAX_TOKEN_COUNT;
        }
        if (startingIndex == 0) {
            startingIndex = 1;
        }
    }

    function setStartingIndexBlockInEmergency() public onlyOwner {
        require(startingIndex == 0, "Starting index already set");
        startingIndexBlock = block.number;
    }

    // Other

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        Address.sendValue(to, amount);
    }

    // Uris

    function contractURI() external view returns (string memory) {
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
        if (bytes(_baseUri).length != 0) {
            return
                string(
                    abi.encodePacked(
                        _baseUri,
                        Strings.toString(tokenId),
                        ".json"
                    )
                );
        } else {
            return _notRevealedImgUri;
        }
    }
}
