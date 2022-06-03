// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StringsRegistry.sol";

contract DomainNamesRegistry is StringsRegistry{

    constructor(bool _uniqueString) StringsRegistry(_uniqueString) { }

    function add(string memory _string) public override {
        require(_isValidDomainName(_string), "invalid domain name");
        super.add(_string);
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