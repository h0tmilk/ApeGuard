// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "../Registries/StringsRegistry.sol";
import "../Registries/DomainNamesRegistry.sol";
import "./TypeRelations/StringsToStringsLink.sol";
import "../AccessControl/AllowedAddresses.sol";

contract ProtocolsDomainNames is AllowedAddresses {
    
    StringsToStringsLink public relationContract;

    constructor(address _protocolsRegistry, address _domainNameRegistry) AllowedAddresses() {
        relationContract = new StringsToStringsLink(_protocolsRegistry, _domainNameRegistry);
    }

    function addDomainName(string memory _domainName, string memory _protocolName) 
    public
    onlyAllowedSender()
    {
        relationContract.linkString(_domainName, _protocolName);
    }

    function removeDomainName(string memory _domainName, string memory _protocolName)
    public
    onlyAllowedSender()
    {
        relationContract.unlinkStrings(_domainName, _protocolName);
    }

    function owns(string memory _protocolName, string memory _domainName)
    public
    view
    returns (bool)
    {
        return relationContract.isLinked(_domainName, _protocolName);
    }

    function getLinksTotalCount()
    public
    view
    returns (uint)
    {
        return relationContract.getLinksTotalCount();
    }

    function getDomainNamesCount(string memory _protocolName)
    public
    view
    returns (uint)
    {
        return relationContract.getStringR1LinkedStringsR2Count(_protocolName);
    }

    function getDomainNameByIndex(string memory _protocolName, uint index)
    public
    view
    returns (string memory)
    {
        return relationContract.getStringR1LinkedStringsR2ByIndex(_protocolName, index);
    }

    function ownersCount(string memory _domainName)
    public
    view
    returns (uint)
    {
        return relationContract.getStringR2LinkedStringsR1Count(_domainName);
    }

    function getOwnerProtocolByIndex(string memory _domainName, uint index)
    public
    view
    returns (string memory)
    {
        return relationContract.getStringR2LinkedStringsR1ByIndex(_domainName, index);
    }
}