// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "../AccessControl/AllowedAddresses.sol";

contract StringsRegistry is AllowedAddresses {

    struct String {
        uint index;
        string actualString;
    }
    
    mapping(bytes32 => String) public stringsMap; // keccak256 hash of lowcase string actualString => index in the list
    bytes32[] public stringsList;

    bool public uniqueString;

    constructor(bool _uniqueString) AllowedAddresses(){
        uniqueString = _uniqueString;
    }

    function add(string memory _string) public virtual onlyAllowedSender {
        bytes32 key = stringToBytes(_string);
        String storage entry = stringsMap[key];
        require(!(uniqueString && _contains(entry)), "string (case insensitive) already in map");

        stringsList.push(key);
        entry.index = stringsList.length - 1;
        entry.actualString = _string;
    }

    function remove(string memory _string) public virtual onlyAllowedSender {
        bytes32 key = stringToBytes(_string);
        String storage entry = stringsMap[key];
        require(_contains(entry), "string (case insensitive) must be present in map");
        require(_isInRange(entry.index), "index must be in range");
        uint256 deleteEntryIndex = entry.index;

        // Move last element into the delete key slot.
        uint256 lastEntryIndex = stringsList.length - 1;
        bytes32 lastEntryStringAddress = stringsList[lastEntryIndex];
        stringsMap[lastEntryStringAddress].index = deleteEntryIndex; // stringsMap
        stringsList[deleteEntryIndex] = stringsList[lastEntryIndex]; // stringsList
        stringsList.pop();
        delete stringsMap[key];
    }

    function getByIndex(uint _index) public view returns (string memory _string) {
        require(_isInRange(_index), "index must be in range");

        return stringsMap[stringsList[_index]].actualString;
    }

    function getStringId(string memory _string) public view returns (uint index) {
        String storage entry = stringsMap[stringToBytes(_string)];
        require(_contains(entry), "string (case insensitive) must be present in map");

        return entry.index;
    }

    function size() public view returns (uint) {
        return stringsList.length;
    }

    function contains(string memory _string) public view returns (bool) {
        String storage entry = stringsMap[stringToBytes(_string)];
        return _contains(entry);
    }

    function _contains(String memory _entry) private pure returns (bool){
        return bytes(_entry.actualString).length != 0;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < stringsList.length);
    }

    function stringToBytes(string memory _string) public pure returns (bytes32) {
        return keccak256(bytes(_toLowerCase(_string)));
    }

    function bytesToStringName(bytes32 _stringBytes) public view returns (string memory) {
        String storage entry = stringsMap[_stringBytes];
        return entry.actualString;
    }

    function _toLowerCase(string memory str) private pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Uppercase character...
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                // So we add 32 to make it lowercase
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }
}