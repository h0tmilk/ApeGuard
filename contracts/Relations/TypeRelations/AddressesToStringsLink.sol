// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "../../Registries/AddressesRegistry.sol";
import "../../Registries/StringsRegistry.sol";
import "../../AccessControl/AllowedAddresses.sol";

contract AddressesToStringsLink is AllowedAddresses {
    struct StringAddressEntry{
        address linkedAddress;
        bytes32 stringId;
        uint entryKeyIndex;
        uint addressToStringIndex;
        uint stringToAddressIndex;
    }
    mapping(bytes32 => StringAddressEntry) public entryMap;
    mapping(address => mapping(bytes32 => bytes32)) public addressToStringMap; // Address + String => key of entryMap

    bytes32[] public entryKeyList; // key list of entryMap
    mapping(address => bytes32[]) public addressToStringListMap; // Address => key list of entryMap
    mapping(bytes32 => bytes32[]) public stringToAddressListMap; // String => key list of entryMap

    AddressesRegistry public addressesRegistry;
    StringsRegistry public stringsRegistry;

    constructor(address _addressesRegistryAddress, address _stringsRegistryAddress) AllowedAddresses() {
        addressesRegistry = AddressesRegistry(_addressesRegistryAddress);
        stringsRegistry = StringsRegistry(_stringsRegistryAddress);

        addressesRegistry.allowAddress(address(this));
        stringsRegistry.allowAddress(address(this));
    }

    function linkAddress(address _address, string memory _string) 
    public
    onlyAllowedSender()
    {
        require(stringsRegistry.contains(_string), "string not registered");
        require(addressesRegistry.contains(_address), "address not registered");
        require(!isLinked(_address,_string), "address is already linked");

        bytes32 stringId = stringsRegistry.stringToBytes(_string);
        bytes32 key = keccak256(abi.encodePacked(_address, stringId));

        StringAddressEntry storage entry = entryMap[key]; // entryMap
        entry.linkedAddress = _address;
        entry.stringId = stringId;
        entryKeyList.push(key);
        entry.entryKeyIndex = entryKeyList.length - 1; // entryKeyList
        addressToStringListMap[_address].push(key);
        entry.addressToStringIndex = addressToStringListMap[_address].length - 1; // addressToStringListMap
        stringToAddressListMap[stringId].push(key);
        entry.stringToAddressIndex = stringToAddressListMap[stringId].length - 1; // stringToAddressListMap

        addressToStringMap[_address][stringId] = key; // addressToStringMap
    }

    function unlinkAddress(address _address, string memory _string)
    public
    onlyAllowedSender()
    {
        require(stringsRegistry.contains(_string), "string not registered");
        require(isLinked(_address,_string), "address is not linked");


        bytes32 stringId = stringsRegistry.stringToBytes(_string);
        bytes32 key = addressToStringMap[_address][stringId];

        StringAddressEntry storage entry = entryMap[key]; // entryMap

        // entryKeyList
        bytes32 lastKeyOfList = entryKeyList[entryKeyList.length - 1];
        entryMap[lastKeyOfList].entryKeyIndex = entry.entryKeyIndex;
        entryKeyList[entry.entryKeyIndex] = lastKeyOfList;
        entryKeyList.pop();

        // addressToStringListMap
        lastKeyOfList = addressToStringListMap[_address][addressToStringListMap[_address].length - 1];
        entryMap[lastKeyOfList].addressToStringIndex = entry.addressToStringIndex;
        addressToStringListMap[_address][entry.addressToStringIndex] = lastKeyOfList;
        addressToStringListMap[_address].pop();

        // stringToAddressListMap
        lastKeyOfList = stringToAddressListMap[stringId][stringToAddressListMap[stringId].length - 1];
        entryMap[lastKeyOfList].stringToAddressIndex = entry.stringToAddressIndex;
        stringToAddressListMap[stringId][entry.stringToAddressIndex] = lastKeyOfList;
        stringToAddressListMap[stringId].pop();

        // delete from addressToStringMap
        delete addressToStringMap[_address][stringId];

        // delete from entryMap
        delete entryMap[key];

        // delete address address to registry if no remaining linked string
        if(getLinkedStringsCount(_address) == 0) {
            addressesRegistry.remove(_address);
        }
    }

    function isLinked(address _address, string memory _string)
    public
    view
    returns (bool)
    {
        bytes32 stringId = stringsRegistry.stringToBytes(_string);
        return _isLinked(addressToStringMap[_address][stringId]);
    }

    function getLinksTotalCount()
    public
    view
    returns (uint)
    {
        return entryKeyList.length;
    }

    function getLinkedStringsCount(address _address)
    public
    view
    returns (uint)
    {
        return addressToStringListMap[_address].length;
    }

    function getLinkedStringById(address _address, uint index)
    public
    view
    returns (string memory)
    {
        require(index >= 0 && index < getLinkedStringsCount(_address), "index out of bounds");
        bytes32 key = addressToStringListMap[_address][index];
        require(_isLinked(key), "entry must be present in map");

        StringAddressEntry storage entry = entryMap[key];
        return stringsRegistry.bytesToStringName(entry.stringId);
    }

    function getLinkedAddressesCount(string memory _string)
    public
    view
    returns (uint)
    {
        bytes32 stringId = stringsRegistry.stringToBytes(_string);
        return stringToAddressListMap[stringId].length;
    }

    function getLinkedAddressById(string memory _string, uint index)
    public
    view
    returns (address)
    {
        bytes32 stringId = stringsRegistry.stringToBytes(_string);
        require(index >= 0 && index < _getLinkedAddressesCount(stringId), "index out of bounds");

        bytes32 key = stringToAddressListMap[stringId][index];
        require(_isLinked(key), "entry must be present in map");

        StringAddressEntry storage entry = entryMap[key];
        return entry.linkedAddress;
    }

    function _getLinkedAddressesCount(bytes32 _stringId)
    private
    view
    returns (uint)
    {
         return stringToAddressListMap[_stringId].length;
    }

    function _isLinked(bytes32 key)
    private
    pure
    returns (bool)
    {
        return key != 0;
    }
}