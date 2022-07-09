// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract AllowedAddresses {
    using SafeMath for uint;

    mapping(address => bool) public allowedAddresses;
    uint public allowedAdddressesCount;

    constructor() {
        allowedAdddressesCount = 0;
        allowAddress(msg.sender);
    }

    function allowAddress(address _addressToAllow) public onlyAllowedSender() {
        require(!allowedAddresses[_addressToAllow], "address already allowed");
        allowedAddresses[_addressToAllow] = true;
        allowedAdddressesCount = allowedAdddressesCount.add(1);
    }

    function disallowAddress(address _addressToAllow) public onlyAllowedSender() {
        require(allowedAddresses[_addressToAllow], "address not even allowed");
        allowedAddresses[_addressToAllow] = false;
        allowedAdddressesCount = allowedAdddressesCount.sub(1);
    }

    function isAllowed(address _address) public view returns (bool){
        return allowedAddresses[_address];
    }

    modifier onlyAllowedSender() {
        require(allowedAddresses[msg.sender] || allowedAdddressesCount == 0, "Caller is not allowed");
        _;
    }
}