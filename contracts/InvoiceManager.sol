pragma solidity ^0.5.1;
pragma experimental ABIEncoderV2;

contract InvoiceManager {

    struct invoiceInfo {
      uint256 bankNo;
      /* TO DO: add an address sender; */
      bytes32[] dataHash;
      uint256 status;
    }

    struct duplicateInfo {
      uint256 index;
      uint256 score;
    }

    mapping(uint256 => invoiceInfo) public invoiceStorage;
    uint256 public numOfInvoices;
    mapping(uint256 => duplicateInfo) public duplicateStorage;

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

    function getNumOfInvoices() public view onlyAdmin returns (uint256) {
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

    function findAndSetDuplicateStatus(duplicateInfo[] memory _allDuplicates, uint256 _prev_status, uint256 _new_status) public {
        for(uint256 i = 0; i < _allDuplicates.length; i++) {
            if(getStatus(_allDuplicates[i].index) == _prev_status) {
                setStatus(_allDuplicates[i].index, _new_status);
            }
        }
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

    function countDuplicateStatuses(duplicateInfo[] memory _allDuplicates)
        internal view
        returns (uint256[] memory)
    {
        uint256[] memory countStatus = new uint256[](11);
        for (uint256 i = 0; i < _allDuplicates.length; i++) {
            countStatus[getStatus(_allDuplicates[i].index)]++;
        }
        return countStatus;
    }

    /* finds exact match index, duplicate indexes and performs duplicate scoring */
    function findDuplicateInvoices(uint256 _bankNo, bytes32[] memory _dataHash)
        public
        returns (bool, bool, uint256, uint256)
    {
        bool sameBank = false;
        bool sameInvoice = false;
        uint256 invoiceIndex = 0;
        uint256 numOfDuplicates = 0;

        for (uint256 i = 0; i < numOfInvoices; i++) {
            /* // TO DO: scoring algorithm here */
            if (getDataHash(i)[0] == _dataHash[0] && getDataHash(i)[1] == _dataHash[1]) {
              sameInvoice = true;
              if (getBankNo(i) == _bankNo) {
                invoiceIndex = i;
                sameBank = true;
              } else {
                duplicateInfo memory newDuplicate = duplicateInfo(i, 100);
                duplicateStorage[numOfDuplicates] = newDuplicate;
                numOfDuplicates++;
              }
            } else if (getDataHash(i)[0] == _dataHash[0] || getDataHash(i)[1] == _dataHash[1]) {
              duplicateInfo memory newDuplicate = duplicateInfo(i, 100);
              duplicateStorage[numOfDuplicates] = newDuplicate;
              numOfDuplicates++;
            }
        }
        return (sameBank, sameInvoice, invoiceIndex, numOfDuplicates);
    }

    function onlyDuplicatesStatus(duplicateInfo[] memory _allDuplicates, uint256[] memory _validStatus)
        public
        view
        returns (bool)
    {
        bool statusesFound = true;
        for (uint256 i = 0; i < _allDuplicates.length; i++) {
          bool statusFound = false;
          for(uint256 j = 0; j < _validStatus.length; j++) {
            if (getStatus(_allDuplicates[i].index) == _validStatus[j]) {
              statusFound = true;
              break;
            }
          }
          if (statusFound == false) { // invoice status not valid
            statusesFound = false;
            break;
          }
        }
        return (statusesFound);
    }

    function approveInvoice(uint256 _bankNo, bytes32[] memory _dataHash, uint256 _timestamp)
        public
        returns (bool)
    {
        bool sameBank = false;
        bool sameInvoice = false;
        uint256 invoiceIndex = 0;
        uint256 numOfDuplicates = 0;
        (sameBank, sameInvoice, invoiceIndex, numOfDuplicates) = findDuplicateInvoices(_bankNo, _dataHash);
        duplicateInfo[] memory allDuplicates = new duplicateInfo[](numOfDuplicates);
        for(uint256 i = 0; i < numOfDuplicates; i++) {
            allDuplicates[i] = duplicateStorage[i];
        }

        bool error = false;

        /* TO DO: forced to init a dynamic array */
        uint256[] memory tempArray123 = new uint256[](3);
        tempArray123[0] = 1;
        tempArray123[1] = 2;
        tempArray123[2] = 3;

        if (sameInvoice) {

            /* TO DO: check invoice status if valid */

            if (sameBank && numOfDuplicates == 0) {
              if (getStatus(invoiceIndex) == 3) {
                setStatus(invoiceIndex, 1);
              } else {
                /* TO DO: should return an error response */
                error = true;
              }
            } else if (numOfDuplicates == 1 && onlyDuplicatesStatus(allDuplicates, tempArray123)) {
              if(!sameBank) { // TO DO: should not add if error!
                invoiceIndex = addInvoice(_bankNo, _dataHash, _timestamp);
              }
              if (getStatus(allDuplicates[0].index) == 1) {
                setStatus(invoiceIndex, 4);
                setStatus(allDuplicates[0].index, 4);
              } else if (getStatus(allDuplicates[0].index) == 2) {
                setStatus(invoiceIndex, 5);
                setStatus(allDuplicates[0].index, 6);
              } else if (getStatus(allDuplicates[0].index) == 3) {
                setStatus(invoiceIndex, 1);
                setStatus(allDuplicates[0].index, 8);
              } else {
                /* TO DO: should return an error response */
                error = true;
              }
            } else if (numOfDuplicates > 1) {
                if(!sameBank) { // TO DO: should not add if error!
                  invoiceIndex = addInvoice(_bankNo, _dataHash, _timestamp);
                }
                uint256[] memory countStatus = countDuplicateStatuses(allDuplicates);
                if (countStatus[6] > 0 || countStatus[7] > 0) {
                  setStatus(invoiceIndex, 5);
                } else if (countStatus[2] > 0) {
                  setStatus(invoiceIndex, 5);
                  findAndSetDuplicateStatus(allDuplicates, 2, 6);
                } else if (countStatus[1] > 0) {
                  setStatus(invoiceIndex, 4);
                  findAndSetDuplicateStatus(allDuplicates, 1, 4);
                } else if (countStatus[4] > 0) {
                  setStatus(invoiceIndex, 4);
                } else if (countStatus[8] == numOfDuplicates) { // only contains 8
                  setStatus(invoiceIndex, 1);
                } else if (countStatus[3] == numOfDuplicates) { // only contains 3
                  setStatus(invoiceIndex, 1);
                  findAndSetDuplicateStatus(allDuplicates, 3, 8);
                } else {
                  /* TO DO: should return an error response */
                  error = true;
                }
            } else {
              /* TO DO: should return an error response */
              error = true;
            }
        } else {
            setStatus(addInvoice(_bankNo, _dataHash, _timestamp), 1);
        }
        return error;
    }

    function financeInvoice(uint256 _bankNo, bytes32[] memory _dataHash, uint256 _timestamp)
        public
        returns (bool)
    {
        bool sameBank = false;
        bool sameInvoice = false;
        uint256 invoiceIndex = 0;
        uint256 numOfDuplicates = 0;
        (sameBank, sameInvoice, invoiceIndex, numOfDuplicates) = findDuplicateInvoices(_bankNo, _dataHash);
        duplicateInfo[] memory allDuplicates = new duplicateInfo[](numOfDuplicates);
        for(uint256 i = 0; i < numOfDuplicates; i++) {
            allDuplicates[i] = duplicateStorage[i];
        }

        bool error = false;

        if (sameInvoice && sameBank) { // TO DO: exact invoice has to be found
            if (numOfDuplicates == 0) {
              if (getStatus(invoiceIndex) == 1) {
                setStatus(invoiceIndex, 2);
              } else {
                /* TO DO: should return an error response */
                error = true;
              }
            } else if (numOfDuplicates == 1) {
              if (getStatus(allDuplicates[0].index) == 4) {
                setStatus(invoiceIndex, 6);
                setStatus(allDuplicates[0].index, 5);
              } else if (getStatus(allDuplicates[0].index) == 6) {
                setStatus(invoiceIndex, 7);
                setStatus(allDuplicates[0].index, 7);
              } else if (getStatus(allDuplicates[0].index) == 8) {
                setStatus(invoiceIndex, 2);
                setStatus(allDuplicates[0].index, 9);
              } else {
                /* TO DO: should return an error response */
                error = true;
              }
            } else if (numOfDuplicates > 1) {
              uint256[] memory countStatus = countDuplicateStatuses(allDuplicates);
              if (countStatus[6] > 0 || countStatus[7] > 0) {
                setStatus(invoiceIndex, 7);
                findAndSetDuplicateStatus(allDuplicates, 6, 7);
              } else if (countStatus[4] > 0) {
                setStatus(invoiceIndex, 6);
                findAndSetDuplicateStatus(allDuplicates, 4, 5);
                findAndSetDuplicateStatus(allDuplicates, 8, 9);
              } else if (countStatus[8] == numOfDuplicates) {
                setStatus(invoiceIndex, 2);
                findAndSetDuplicateStatus(allDuplicates, 8, 9);
              } else {
                /* TO DO: should return an error response */
                error = true;
              }
            }
        } else {
            /* TO DO: should return an error response */
            error = true;
        }
        return error;
    }

    function reverseInvoice(uint256 _bankNo, bytes32[] memory _dataHash, uint256 _timestamp)
        public
        returns (bool)
    {
        bool sameBank = false;
        bool sameInvoice = false;
        uint256 invoiceIndex = 0;
        uint256 numOfDuplicates = 0;
        (sameBank, sameInvoice, invoiceIndex, numOfDuplicates) = findDuplicateInvoices(_bankNo, _dataHash);
        duplicateInfo[] memory allDuplicates = new duplicateInfo[](numOfDuplicates);
        for(uint256 i = 0; i < numOfDuplicates; i++) {
            allDuplicates[i] = duplicateStorage[i];
        }

        bool error = false;

        if (sameInvoice && sameBank) { // TO DO: exact invoice has to be found
            if (numOfDuplicates == 0) {
              if (getStatus(invoiceIndex) == 1) {
                setStatus(invoiceIndex, 3);
              } else {
                /* TO DO: should return an error response */
                error = true;
              }
            } else if (numOfDuplicates == 1) {
              if (getStatus(allDuplicates[0].index) == 4) {
                setStatus(invoiceIndex, 8);
                setStatus(allDuplicates[0].index, 1);
              } else if (getStatus(allDuplicates[0].index) == 6) {
                setStatus(invoiceIndex, 9);
                setStatus(allDuplicates[0].index, 2);
              } else if (getStatus(allDuplicates[0].index) == 8) {
                setStatus(invoiceIndex, 3);
                setStatus(allDuplicates[0].index, 3);
              } else {
                /* TO DO: should return an error response */
                error = true;
              }
            } else if (numOfDuplicates > 1) {
              uint256[] memory countStatus = countDuplicateStatuses(allDuplicates);
              if (countStatus[6] > 0 || countStatus[7] > 0) {
                setStatus(invoiceIndex, 9);
                if (countDuplicateStatuses(allDuplicates)[5] < 1) {
                  findAndSetDuplicateStatus(allDuplicates, 6, 2);
                }
              } else if (countStatus[4] > 0) {
                setStatus(invoiceIndex, 8);
                if (countDuplicateStatuses(allDuplicates)[4] == 1) {
                  findAndSetDuplicateStatus(allDuplicates, 4, 1);
                }
              } else if (countStatus[8] == numOfDuplicates) {
                setStatus(invoiceIndex, 3);
                if (countDuplicateStatuses(allDuplicates)[1] < 1) {
                  findAndSetDuplicateStatus(allDuplicates, 8, 3);
                }
              } else {
                /* TO DO: should return an error response */
                error = true;
              }
            }
        } else {
            /* TO DO: should return an error response */
            error = true;
        }
        return error;
    }
}
