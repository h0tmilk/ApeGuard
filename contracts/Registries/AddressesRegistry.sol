// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AddressesRegistry is Ownable {

    struct Address {
        uint index;
        bool exists;
    }
    
    mapping(address => Address) public addressesMap; // address => index in the list
    address[] public addressesList;

    function add(address _address) public virtual onlyOwner {
        Address storage entry = addressesMap[_address];
        require(!_contains(entry), "address already in map");

        addressesList.push(_address);
        entry.index = addressesList.length - 1;
        entry.exists = true;
    }

    function remove(address _address) public virtual onlyOwner {
        Address storage entry = addressesMap[_address];
        require(_contains(entry), "address must be present in map");
        require(_isInRange(entry.index), "index must be in range");
        uint256 deleteEntryIndex = entry.index;

        // Move last element into the delete key slot.
        uint256 lastEntryIndex = addressesList.length - 1;
        address lastEntryAddress = addressesList[lastEntryIndex];
        addressesMap[lastEntryAddress].index = deleteEntryIndex; // addressesMap
        addressesList[deleteEntryIndex] = addressesList[lastEntryIndex]; // addressesList
        addressesList.pop();
        delete addressesMap[_address];
    }

    function getByIndex(uint _index) public view returns (address _address) {
        require(_isInRange(_index), "index must be in range");

        return addressesList[_index];
    }

    function getAddressId(address _address) public view returns (uint index, bool exists) {
        Address storage entry = addressesMap[_address];
        require(_contains(entry), "address must be present in map");

        return (entry.index, entry.exists);
    }

    function size() public view returns (uint) {
        return addressesList.length;
    }

    function contains(address _address) public view returns (bool) {
        Address storage entry = addressesMap[_address];
        return _contains(entry);
    }

    function _contains(Address memory _entry) private pure returns (bool){
        return _entry.exists;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < addressesList.length);
    }
}