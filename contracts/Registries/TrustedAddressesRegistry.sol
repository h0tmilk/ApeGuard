// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustedAddressesRegistry is Ownable {

    struct TrustedAddress {
        uint index;
        bool exists;
    }
    
    mapping(address => TrustedAddress) public trustedAddressesMap; // address => index in the list
    address[] public trustedAddressesList;

    function add(address _trustedAddressAddress) public onlyOwner {
        TrustedAddress storage entry = trustedAddressesMap[_trustedAddressAddress];
        require(!_contains(entry), "trustedAddress already in map");

        trustedAddressesList.push(_trustedAddressAddress);
        entry.index = trustedAddressesList.length - 1;
        entry.exists = true;
    }

    function remove(address _trustedAddressAddress) public onlyOwner {
        TrustedAddress storage entry = trustedAddressesMap[_trustedAddressAddress];
        require(_contains(entry), "trustedAddressAddress must be present in map");
        require(_isInRange(entry.index), "index must be in range");
        uint256 deleteEntryIndex = entry.index;

        // Move last element into the delete key slot.
        uint256 lastEntryIndex = trustedAddressesList.length - 1;
        address lastEntryTrustedAddressAddress = trustedAddressesList[lastEntryIndex];
        trustedAddressesMap[lastEntryTrustedAddressAddress].index = deleteEntryIndex; // trustedAddressesMap
        trustedAddressesList[deleteEntryIndex] = trustedAddressesList[lastEntryIndex]; // trustedAddressesList
        trustedAddressesList.pop();
        delete trustedAddressesMap[_trustedAddressAddress];
    }

    function getByIndex(uint _index) public view returns (address _trustedAddressAddress) {
        require(_isInRange(_index), "index must be in range");

        return trustedAddressesList[_index];
    }

    function getTrustedAddressId(address _trustedAddressAddress) public view returns (uint index, bool exists) {
        TrustedAddress storage entry = trustedAddressesMap[_trustedAddressAddress];
        require(_contains(entry), "trustedAddressAddress must be present in map");

        return (entry.index, entry.exists);
    }

    function size() public view returns (uint) {
        return trustedAddressesList.length;
    }

    function contains(address _trustedAddressAddress) public view returns (bool) {
        TrustedAddress storage entry = trustedAddressesMap[_trustedAddressAddress];
        return _contains(entry);
    }

    function _contains(TrustedAddress memory _entry) private pure returns (bool){
        return _entry.exists;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < trustedAddressesList.length);
    }
}