pragma solidity ^0.5.1;
pragma experimental ABIEncoderV2;

contract InvoiceStorage {

    struct invoiceInfo {
      uint256 bankNo;
      /* TO DO: add an address sender; */
      bytes32[] dataHash;
      uint256 status;
    }

    mapping(uint256 => invoiceInfo) public invoiceStorage;
    uint256 public numOfInvoices;

    address public adminAddress;
    address public owner;

    constructor(
        address _adminAddress
    ) public {
        adminAddress = _adminAddress;
        owner = msg.sender;
        numOfInvoices = 0;
    }

    /* prepend a check that function is called by admin address */
    modifier onlyAdmin {
        require(msg.sender == adminAddress, 'only admin has access');
        _;
    }

    /* prepend a check that function is called by owner address */
    modifier onlyOwner {
        require(msg.sender == owner, 'only owner has access');
        _;
    }

    function getNumOfInvoices() public view returns (uint256) {
        return numOfInvoices;
    }

    function getBankNo(uint256 _invoiceID) public view returns(uint256) {
        return invoiceStorage[_invoiceID].bankNo;
    }

    function getDataHash(uint256 _invoiceID) public view returns(bytes32[] memory) {
        return invoiceStorage[_invoiceID].dataHash;
    }

    function getStatus(uint256 _invoiceID) public view returns(uint256) {
        return invoiceStorage[_invoiceID].status;
    }

    function setStatus(uint256 _invoiceID, uint256 _status) public {
        invoiceStorage[_invoiceID].status = _status;
    }

    function addInvoice(uint256 _bankNo, bytes32[] memory _dataHash, uint256 _timestamp)
        public
        returns (uint256)
    {
        uint256 invoiceID = numOfInvoices;
        numOfInvoices++;
        invoiceInfo memory newInvoice = invoiceInfo(_bankNo, _dataHash, 0);
        invoiceStorage[invoiceID] = newInvoice;
        return invoiceID;
    }
}
