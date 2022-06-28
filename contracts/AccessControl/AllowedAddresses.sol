// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract AllowedAddresses {
    mapping(address => bool) public allowedAddresses;

    constructor() {
        allowedAddresses[msg.sender] = true;
    }

    function allowAddress(address _addressToAllow) public {
        allowedAddresses[_addressToAllow] = true;
    }

    function disallowAddress(address _addressToAllow) public {
        allowedAddresses[_addressToAllow] = false;
    }

    modifier onlyAllowedSender() {
        require(allowedAddresses[msg.sender], "Caller is not allowed");
        _;
    }
}