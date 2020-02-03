pragma solidity ^0.5.1;
pragma experimental ABIEncoderV2;

contract InvoiceStorage {

    struct invoiceInfo {
      uint256 bankNo;
      address sender;
      bytes32[] dataHash;
      uint256 status;
      uint256 numOfHistory;
      mapping(uint256 => string) private history;
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
        numOfHistory = 0;
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

    function getHistory() public view returns (string[] memory) {
        return history;
    }

    function setStatus(uint256 _invoiceID, uint256 _status) public {
        invoiceStorage[_invoiceID].status = _status;
    }

    function addHistory(uint256 _invoiceID, string _message, uint256 _timestamp)
        public
        returns (bool)
    {
        uint256 histID = numOfHistory++;
        invoiceInfo memory newInvoice = invoiceInfo(_bankNo, sender, _dataHash, 0);
        invoiceStorage[histID] = newInvoice;
        addHistory(histID, 'Invoice created', _timestamp);
        return histID;
    }

    function addInvoice(uint256 _bankNo, address sender, bytes32[] memory _dataHash, uint256 _timestamp)
        public
        returns (uint256)
    {
        uint256 invoiceID = numOfInvoices++;
        invoiceInfo memory newInvoice = invoiceInfo(_bankNo, sender, _dataHash, 0);
        invoiceStorage[invoiceID] = newInvoice;
        addHistory(invoiceID, 'Invoice created', _timestamp);
        return invoiceID;
    }

    function removeInvoice(uint256 invoiceIndex) public {
        for(uint256 i = invoiceIndex; i < numOfInvoices; i++) {
            invoiceStorage[i] = invoiceStorage[i + 1];
        }
        numOfInvoices--;
    }
}
