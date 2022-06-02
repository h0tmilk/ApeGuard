// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProtocolsRegistry is Ownable {

    struct Protocol {
        uint index;
        string name;
    }
    
    mapping(bytes32 => Protocol) public protocolsMap; // keccak256 hash of lowcase protocol name => index in the list
    bytes32[] public protocolsList;

    function add(string memory _protocolName) public onlyOwner {
        bytes32 key = protocolNameToBytes(_protocolName);
        Protocol storage entry = protocolsMap[key];
        require(!_contains(entry), "protocolName (case insensitive) already in map");

        protocolsList.push(key);
        entry.index = protocolsList.length - 1;
        entry.name = _protocolName;
    }

    function remove(string memory _protocolName) public onlyOwner {
        bytes32 key = protocolNameToBytes(_protocolName);
        Protocol storage entry = protocolsMap[key];
        require(_contains(entry), "protocolName (case insensitive) must be present in map");
        require(_isInRange(entry.index), "index must be in range");
        uint256 deleteEntryIndex = entry.index;

        // Move last element into the delete key slot.
        uint256 lastEntryIndex = protocolsList.length - 1;
        bytes32 lastEntryProtocolAddress = protocolsList[lastEntryIndex];
        protocolsMap[lastEntryProtocolAddress].index = deleteEntryIndex; // protocolsMap
        protocolsList[deleteEntryIndex] = protocolsList[lastEntryIndex]; // protocolsList
        protocolsList.pop();
        delete protocolsMap[key];
    }

    function getByIndex(uint _index) public view returns (string memory _protocolName) {
        require(_isInRange(_index), "index must be in range");

        return protocolsMap[protocolsList[_index]].name;
    }

    function getProtocolId(string memory _protocolName) public view returns (uint index) {
        Protocol storage entry = protocolsMap[protocolNameToBytes(_protocolName)];
        require(_contains(entry), "protocolName (case insensitive) must be present in map");

        return entry.index;
    }

    function size() public view returns (uint) {
        return protocolsList.length;
    }

    function contains(string memory _protocolName) public view returns (bool) {
        Protocol storage entry = protocolsMap[protocolNameToBytes(_protocolName)];
        return _contains(entry);
    }

    function _contains(Protocol memory _entry) private pure returns (bool){
        return bytes(_entry.name).length != 0;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < protocolsList.length);
    }

    function protocolNameToBytes(string memory _protocolName) public pure returns (bytes32) {
        return keccak256(bytes(_toLowerCase(_protocolName)));
    }

    function bytesToProtocolName(bytes32 _protocolBytes) public view returns (string memory) {
        Protocol storage entry = protocolsMap[_protocolBytes];
        return entry.name;
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