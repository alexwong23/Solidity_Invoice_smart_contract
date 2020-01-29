pragma solidity ^0.5.1;
pragma experimental ABIEncoderV2;
import './invoiceStorage.sol';
contract InvoiceManager {

    InvoiceStorage invoiceStorage;

    struct duplicateInfo {
      uint256 index;
      uint256 score;
    }

    mapping(uint256 => duplicateInfo) public duplicateStorage;
    address public adminAddress;
    address public owner;

    constructor(
        address _adminAddress,
        address _storageAddress
    ) public {
        invoiceStorage = InvoiceStorage(_storageAddress);
        adminAddress = _adminAddress;
        owner = msg.sender;
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

    function findAndSetDuplicateStatus(duplicateInfo[] memory _allDuplicates, uint256 _prev_status, uint256 _new_status) public {
        for(uint256 i = 0; i < _allDuplicates.length; i++) {
            if(invoiceStorage.getStatus(_allDuplicates[i].index) == _prev_status) {
                invoiceStorage.setStatus(_allDuplicates[i].index, _new_status);
            }
        }
    }

    function countDuplicateStatuses(duplicateInfo[] memory _allDuplicates)
        internal view
        returns (uint256[] memory)
    {
        uint256[] memory countStatus = new uint256[](11);
        for (uint256 i = 0; i < _allDuplicates.length; i++) {
            countStatus[invoiceStorage.getStatus(_allDuplicates[i].index)]++;
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

        for (uint256 i = 0; i < invoiceStorage.getNumOfInvoices(); i++) {
            /* exact invoice found */
            if (invoiceStorage.getDataHash(i)[0] == _dataHash[0] && invoiceStorage.getDataHash(i)[1] == _dataHash[1]) {
                sameInvoice = true;
                if (invoiceStorage.getBankNo(i) == _bankNo) {
                    invoiceIndex = i;
                    sameBank = true;
                } else {
                    duplicateInfo memory newDuplicate = duplicateInfo(i, 100);
                    duplicateStorage[numOfDuplicates] = newDuplicate;
                    numOfDuplicates++;
                }
            /* // TO DO: scoring algorithm here */
            } else if (invoiceStorage.getDataHash(i)[0] == _dataHash[0] || invoiceStorage.getDataHash(i)[1] == _dataHash[1]) {
                duplicateInfo memory newDuplicate = duplicateInfo(i, 100);
                duplicateStorage[numOfDuplicates] = newDuplicate;
                numOfDuplicates++;
            }
        }
        return (sameBank, sameInvoice, invoiceIndex, numOfDuplicates);
    }

    /* TO DO: forced to init a dynamic array */
    /* uint256[] memory tempArray123 = new uint256[](3);
    tempArray123[0] = 1;
    tempArray123[1] = 2;
    tempArray123[2] = 3; */
    function onlyStatuses(uint256 invoiceIndex, uint8[3] memory _validStatus)
        public
        view
        returns (bool)
    {
        bool statusFound = false;
        for(uint256 j = 0; j < _validStatus.length; j++) {
            if (invoiceStorage.getStatus(invoiceIndex) == _validStatus[j]) {
                statusFound = true;
                break;
            }
        }
        return statusFound;
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

        if (sameInvoice) {
            if (sameBank && numOfDuplicates == 0 && invoiceStorage.getStatus(invoiceIndex) == 3) { // approve single reversed invoice
                invoiceStorage.setStatus(invoiceIndex, 1);
            } else if (!sameBank || (sameBank && onlyStatuses(invoiceIndex, [3, 8, 9]))) { // if invoice exist, check if status valid
                if (numOfDuplicates == 1 && onlyStatuses(allDuplicates[0].index, [1, 2, 3])) {
                    // add invoice if NEW bank submits same invoice
                    if(!sameBank) invoiceIndex = invoiceStorage.addInvoice(_bankNo, msg.sender, _dataHash, _timestamp);
                    if (invoiceStorage.getStatus(allDuplicates[0].index) == 1) {
                        invoiceStorage.setStatus(invoiceIndex, 4);
                        invoiceStorage.setStatus(allDuplicates[0].index, 4);
                    } else if (invoiceStorage.getStatus(allDuplicates[0].index) == 2) {
                        invoiceStorage.setStatus(invoiceIndex, 5);
                        invoiceStorage.setStatus(allDuplicates[0].index, 6);
                    } else if (invoiceStorage.getStatus(allDuplicates[0].index) == 3) {
                        invoiceStorage.setStatus(invoiceIndex, 1);
                        invoiceStorage.setStatus(allDuplicates[0].index, 8);
                    }
                } else if (numOfDuplicates > 1) {
                    // add invoice if NEW bank submits same invoice
                    if(!sameBank) invoiceIndex = invoiceStorage.addInvoice(_bankNo, msg.sender, _dataHash, _timestamp);
                    uint256[] memory countStatus = countDuplicateStatuses(allDuplicates);
                    if (countStatus[6] > 0 || countStatus[7] > 0) {
                        invoiceStorage.setStatus(invoiceIndex, 5);
                    } else if (countStatus[2] > 0) {
                        invoiceStorage.setStatus(invoiceIndex, 5);
                        findAndSetDuplicateStatus(allDuplicates, 2, 6);
                    } else if (countStatus[1] > 0) {
                        invoiceStorage.setStatus(invoiceIndex, 4);
                        findAndSetDuplicateStatus(allDuplicates, 1, 4);
                    } else if (countStatus[4] > 0) {
                        invoiceStorage.setStatus(invoiceIndex, 4);
                    }   else if (countStatus[8] == numOfDuplicates) { // only contains 8
                        invoiceStorage.setStatus(invoiceIndex, 1);
                    }   else if (countStatus[3] == numOfDuplicates) { // only contains 3
                        invoiceStorage.setStatus(invoiceIndex, 1);
                        findAndSetDuplicateStatus(allDuplicates, 3, 8);
                    } else {
                        if(!sameBank) invoiceStorage.removeInvoice(invoiceIndex); // remove invoice if error
                        /* TO DO: should return an error response */
                        error = true;
                    }
                }
            } else {
                /* TO DO: should return an error response */
                error = true;
            }
        } else {
            invoiceStorage.setStatus(invoiceStorage.addInvoice(_bankNo, msg.sender, _dataHash, _timestamp), 1);
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

        if (sameInvoice && sameBank && onlyStatuses(invoiceIndex, [1, 4, 5])) {
            if (numOfDuplicates == 0 && invoiceStorage.getStatus(invoiceIndex) == 1) {
                invoiceStorage.setStatus(invoiceIndex, 2);
            } else if (numOfDuplicates == 1 && onlyStatuses(allDuplicates[0].index, [4, 6, 8])) {
                if (invoiceStorage.getStatus(allDuplicates[0].index) == 4) {
                    invoiceStorage.setStatus(invoiceIndex, 6);
                    invoiceStorage.setStatus(allDuplicates[0].index, 5);
                } else if (invoiceStorage.getStatus(allDuplicates[0].index) == 6) {
                    invoiceStorage.setStatus(invoiceIndex, 7);
                    invoiceStorage.setStatus(allDuplicates[0].index, 7);
                } else if (invoiceStorage.getStatus(allDuplicates[0].index) == 8) {
                    invoiceStorage.setStatus(invoiceIndex, 2);
                    invoiceStorage.setStatus(allDuplicates[0].index, 9);
                }
            } else if (numOfDuplicates > 1) {
                uint256[] memory countStatus = countDuplicateStatuses(allDuplicates);
                if (countStatus[6] > 0 || countStatus[7] > 0) {
                    invoiceStorage.setStatus(invoiceIndex, 7);
                    findAndSetDuplicateStatus(allDuplicates, 6, 7);
                } else if (countStatus[4] > 0) {
                    invoiceStorage.setStatus(invoiceIndex, 6);
                    findAndSetDuplicateStatus(allDuplicates, 4, 5);
                    findAndSetDuplicateStatus(allDuplicates, 8, 9);
                } else if (countStatus[8] == numOfDuplicates) {
                    invoiceStorage.setStatus(invoiceIndex, 2);
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

        if (sameInvoice && sameBank && onlyStatuses(invoiceIndex, [1, 4, 5])) {
            if (numOfDuplicates == 0 && invoiceStorage.getStatus(invoiceIndex) == 1) {
                invoiceStorage.setStatus(invoiceIndex, 3);
            } else if (numOfDuplicates == 1 && onlyStatuses(allDuplicates[0].index, [4, 6, 8])) {
                if (invoiceStorage.getStatus(allDuplicates[0].index) == 4) {
                    invoiceStorage.setStatus(invoiceIndex, 8);
                    invoiceStorage.setStatus(allDuplicates[0].index, 1);
                } else if (invoiceStorage.getStatus(allDuplicates[0].index) == 6) {
                    invoiceStorage.setStatus(invoiceIndex, 9);
                    invoiceStorage.setStatus(allDuplicates[0].index, 2);
                } else if (invoiceStorage.getStatus(allDuplicates[0].index) == 8) {
                    invoiceStorage.setStatus(invoiceIndex, 3);
                    invoiceStorage.setStatus(allDuplicates[0].index, 3);
                }
            } else if (numOfDuplicates > 1) {
                uint256[] memory countStatus = countDuplicateStatuses(allDuplicates);
                if (countStatus[6] > 0 || countStatus[7] > 0) {
                    invoiceStorage.setStatus(invoiceIndex, 9);
                    if (countDuplicateStatuses(allDuplicates)[5] < 1) {
                        findAndSetDuplicateStatus(allDuplicates, 6, 2);
                    }
                } else if (countStatus[4] > 0) {
                    invoiceStorage.setStatus(invoiceIndex, 8);
                    if (countDuplicateStatuses(allDuplicates)[4] == 1) {
                        findAndSetDuplicateStatus(allDuplicates, 4, 1);
                    }
                } else if (countStatus[8] == numOfDuplicates) {
                    invoiceStorage.setStatus(invoiceIndex, 3);
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
