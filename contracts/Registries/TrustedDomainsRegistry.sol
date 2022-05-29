// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustedDomainsRegistry is Ownable {

    struct TrustedDomain {
        uint index;
        string domainName;
    }
    
    mapping(bytes32 => TrustedDomain) public trustedDomainsMap; // keccak256 hash of lowcase trusted domain => index in the list
    bytes32[] public trustedDomainsList;

    function add(string memory _trustedDomainName) public onlyOwner {
        require(_isValidDomainName(_trustedDomainName), "invalid domain name - unallowed character");
        bytes32 key = _trustedDomainNameToIndex(_trustedDomainName);
        TrustedDomain storage entry = trustedDomainsMap[key];
        require(!_contains(entry), "trustedDomainName (case insensitive) already in map");

        trustedDomainsList.push(key);
        entry.index = trustedDomainsList.length - 1;
        entry.domainName = _trustedDomainName;
    }

    function remove(string memory _trustedDomainName) public onlyOwner {
        bytes32 key = _trustedDomainNameToIndex(_trustedDomainName);
        TrustedDomain storage entry = trustedDomainsMap[key];
        require(_contains(entry), "trustedDomainName (case insensitive) must be present in map");
        require(_isInRange(entry.index), "index must be in range");
        uint256 deleteEntryIndex = entry.index;

        // Move last element into the delete key slot.
        uint256 lastEntryIndex = trustedDomainsList.length - 1;
        bytes32 lastEntryTrustedDomainAddress = trustedDomainsList[lastEntryIndex];
        trustedDomainsMap[lastEntryTrustedDomainAddress].index = deleteEntryIndex; // trustedDomainsMap
        trustedDomainsList[deleteEntryIndex] = trustedDomainsList[lastEntryIndex]; // trustedDomainsList
        trustedDomainsList.pop();
        delete trustedDomainsMap[key];
    }

    function getByIndex(uint _index) public view returns (string memory _trustedDomainName) {
        require(_isInRange(_index), "index must be in range");

        return trustedDomainsMap[trustedDomainsList[_index]].domainName;
    }

    function getTrustedDomainId(string memory _trustedDomainName) public view returns (uint index) {
        TrustedDomain storage entry = trustedDomainsMap[_trustedDomainNameToIndex(_trustedDomainName)];
        require(_contains(entry), "trustedDomainName (case insensitive) must be present in map");

        return entry.index;
    }

    function size() public view returns (uint) {
        return trustedDomainsList.length;
    }

    function contains(string memory _trustedDomainName) public view returns (bool) {
        TrustedDomain storage entry = trustedDomainsMap[_trustedDomainNameToIndex(_trustedDomainName)];
        return _contains(entry);
    }

    function _contains(TrustedDomain memory _entry) private pure returns (bool){
        return bytes(_entry.domainName).length != 0;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < trustedDomainsList.length);
    }

    function _trustedDomainNameToIndex(string memory _trustedDomainName) private pure returns (bytes32) {
        return keccak256(bytes(_toLowerCase(_trustedDomainName)));
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

    function _isValidDomainName(string memory _domainName) private pure returns (bool){
        bytes memory domainName = bytes(_domainName);
        if(domainName.length > 67) {
            return false;
        }
        uint8 lastChar = 0;
        bool atLeastOneDot = false;
        for(uint i = 0; i < domainName.length; i++) {
            if(!(
                ((uint8(domainName[i]) >= 65) && (uint8(domainName[i]) <= 90)) // A-Z
                || ((uint8(domainName[i]) >= 97) && (uint8(domainName[i]) <= 122)) // a-z
                || ((uint8(domainName[i]) >= 48) && (uint8(domainName[i]) <= 57)) // 0-9
                || ((uint8(domainName[i]) == 45 || uint8(domainName[i]) == 46) 
                    && (i != domainName.length-1) && (i != 0) 
                    && (lastChar != 45) && (lastChar != 46)) // chars '-' and '.' not at the beginning nor at the end and not following
            )) {
                return false;
            }
            if(uint8(domainName[i]) == 46) { atLeastOneDot = true; }
            lastChar = uint8(domainName[i]);
        }
        return atLeastOneDot;
    }
}