// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "../Registries/AddressesRegistry.sol";
import "../Registries/StringsRegistry.sol";
import "./TypeRelations/AddressesToStringsLink.sol";
import "../AccessControl/AllowedAddresses.sol";

contract ProtocolsAddresses is AllowedAddresses {
    
    AddressesToStringsLink public relationContract;

    constructor(AddressesRegistry _addressesRegistryAddress, StringsRegistry _protocolNamesRegistryAddress) AllowedAddresses() {
        relationContract = new AddressesToStringsLink(_addressesRegistryAddress, _protocolNamesRegistryAddress);
    }

    function addAddress(address _address, string memory _protocolName) 
    public
    onlyAllowedSender()
    {
        relationContract.linkAddress(_address, _protocolName);
    }

    function removeAddress(address _address, string memory _protocolName)
    public
    onlyAllowedSender()
    {
        relationContract.unlinkAddress(_address, _protocolName);
    }

    function owns(string memory _protocolName, address _address)
    public
    view
    returns (bool)
    {
        return relationContract.isLinked(_address, _protocolName);
    }

    function protocolsAddressesCount()
    public
    view
    returns (uint)
    {
        return relationContract.getLinksTotalCount();
    }

    function ownersCount(address _address)
    public
    view
    returns (uint)
    {
        return relationContract.getLinkedStringsCount(_address);
    }

    function getOwnerProtocolById(address _address, uint index)
    public
    view
    returns (string memory)
    {
        return relationContract.getLinkedStringById(_address, index);
    }

    function addressesCount(string memory _protocolName)
    public
    view
    returns (uint)
    {
        return relationContract.getLinkedAddressesCount(_protocolName);
    }

    function getAddressById(string memory _ownerProtocolName, uint index)
    public
    view
    returns (address)
    {
        return relationContract.getLinkedAddressById(_ownerProtocolName, index);
    }
}