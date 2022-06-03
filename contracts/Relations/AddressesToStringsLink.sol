// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "../Registries/AddressesRegistry.sol";
import "../Registries/StringsRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AddressesToStringsLink is Ownable {
    struct StringAddressEntry{
        address addressAddress;
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

    AddressesRegistry addressesRegistry;
    StringsRegistry stringsRegistry;

    constructor(address _addressesRegistryAddress, address _stringsRegistryAddress) {
        addressesRegistry = AddressesRegistry(_addressesRegistryAddress);
        stringsRegistry = StringsRegistry(_stringsRegistryAddress);
    }

    function linkAddress(address _addressAddress, string memory _stringName) 
    public
    onlyOwner()
    {
        require(stringsRegistry.contains(_stringName), "string not registered");
        require(!isLinked(_addressAddress,_stringName), "address is already linked");

        bytes32 stringId = stringsRegistry.stringToBytes(_stringName);
        bytes32 key = keccak256(abi.encodePacked(_addressAddress, stringId));

        StringAddressEntry storage entry = entryMap[key]; // entryMap
        entry.addressAddress = _addressAddress;
        entry.stringId = stringId;
        entryKeyList.push(key);
        entry.entryKeyIndex = entryKeyList.length - 1; // entryKeyList
        addressToStringListMap[_addressAddress].push(key);
        entry.addressToStringIndex = addressToStringListMap[_addressAddress].length - 1; // addressToStringListMap
        stringToAddressListMap[stringId].push(key);
        entry.stringToAddressIndex = stringToAddressListMap[stringId].length - 1; // stringToAddressListMap

        addressToStringMap[_addressAddress][stringId] = key; // addressToStringMap

        // add address address to registry if not present
        if(!addressesRegistry.contains(_addressAddress)) {
            addressesRegistry.add(_addressAddress);
        }
    }

    function unlinkAddress(address _addressAddress, string memory _stringName)
    public
    onlyOwner()
    {
        require(stringsRegistry.contains(_stringName), "string not registered");
        require(isLinked(_addressAddress,_stringName), "address is not linked");


        bytes32 stringId = stringsRegistry.stringToBytes(_stringName);
        bytes32 key = addressToStringMap[_addressAddress][stringId];

        StringAddressEntry storage entry = entryMap[key]; // entryMap

        // entryKeyList
        bytes32 lastKeyOfList = entryKeyList[entryKeyList.length - 1];
        entryMap[lastKeyOfList].entryKeyIndex = entry.entryKeyIndex;
        entryKeyList[entry.entryKeyIndex] = lastKeyOfList;
        entryKeyList.pop();

        // addressToStringListMap
        lastKeyOfList = addressToStringListMap[_addressAddress][addressToStringListMap[_addressAddress].length - 1];
        entryMap[lastKeyOfList].addressToStringIndex = entry.addressToStringIndex;
        addressToStringListMap[_addressAddress][entry.addressToStringIndex] = lastKeyOfList;
        addressToStringListMap[_addressAddress].pop();

        // stringToAddressListMap
        lastKeyOfList = stringToAddressListMap[stringId][stringToAddressListMap[stringId].length - 1];
        entryMap[lastKeyOfList].stringToAddressIndex = entry.stringToAddressIndex;
        stringToAddressListMap[stringId][entry.stringToAddressIndex] = lastKeyOfList;
        stringToAddressListMap[stringId].pop();

        // delete from addressToStringMap
        delete addressToStringMap[_addressAddress][stringId];

        // delete from entryMap
        delete entryMap[key];

        // delete address address to registry if no remaining linked string
        if(getLinkedStringsCount(_addressAddress) == 0) {
            addressesRegistry.remove(_addressAddress);
        }
    }

    function isLinked(address _addressAddress, string memory _stringId)
    public
    view
    returns (bool)
    {
        bytes32 stringId = stringsRegistry.stringToBytes(_stringId);
        return _isLinked(addressToStringMap[_addressAddress][stringId]);
    }

    function getLinksTotalCount()
    public
    view
    returns (uint)
    {
        return entryKeyList.length;
    }

    function getLinkedStringsCount(address _addressAddress)
    public
    view
    returns (uint)
    {
        return addressToStringListMap[_addressAddress].length;
    }

    function getLinkedStringById(address _addressAddress, uint index)
    public
    view
    returns (string memory)
    {
        bytes32 key = addressToStringListMap[_addressAddress][index];
        require(_isLinked(key), "entry must be present in map");

        StringAddressEntry storage entry = entryMap[key];
        return stringsRegistry.bytesToStringName(entry.stringId);
    }

    function getLinkedAddressesCount(string memory _stringId)
    public
    view
    returns (uint)
    {
        bytes32 stringId = stringsRegistry.stringToBytes(_stringId);
        return stringToAddressListMap[stringId].length;
    }

    function getLinkedAddressById(string memory _stringId, uint index)
    public
    view
    returns (address)
    {
        bytes32 stringId = stringsRegistry.stringToBytes(_stringId);
        bytes32 key = stringToAddressListMap[stringId][index];
        require(_isLinked(key), "entry must be present in map");

        StringAddressEntry storage entry = entryMap[key];
        return entry.addressAddress;
    }

    function _isLinked(bytes32 key)
    private
    pure
    returns (bool)
    {
        return key != 0;
    }
}