// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "../../Registries/StringsRegistry.sol";
import "../../AccessControl/AllowedAddresses.sol";

contract StringsToStringsLink is AllowedAddresses {
    struct StringsLinkEntry{
        bytes32 stringIdFromR1;
        bytes32 stringIdFromR2;
        uint entryKeyIndex;
        uint stringR1ToStringR2Index;
        uint stringR2ToStringR1Index;
    }
    mapping(bytes32 => StringsLinkEntry) public entryMap;
    mapping(bytes32 => mapping(bytes32 => bytes32)) public entryKeyIndexMap; // stringIdFromR1 + stringIdFromR2 => key of entryMap

    bytes32[] public entryKeyList; // key list of entryMap
    mapping(bytes32 => bytes32[]) public stringR1ToStringR2; // Address => key list of entryMap
    mapping(bytes32 => bytes32[]) public stringR2ToStringR1; // String => key list of entryMap

    StringsRegistry public stringsRegistry1;
    StringsRegistry public stringsRegistry2;

    constructor(StringsRegistry _stringsRegistry1Address, StringsRegistry _stringsRegistry2Address) AllowedAddresses(){
        stringsRegistry1 = _stringsRegistry1Address;
        stringsRegistry2 = _stringsRegistry2Address;
    }

    function linkString(string memory _stringFromRegistry2, string memory _stringFromRegistry1) 
    public
    onlyAllowedSender()
    {
        require(stringsRegistry1.contains(_stringFromRegistry1) && stringsRegistry2.contains(_stringFromRegistry2), 
            "one or both strings are not registered");
        require(!isLinked(_stringFromRegistry2,_stringFromRegistry1), "strings are is already linked");

        bytes32 stringIdFromR1 = stringsRegistry1.stringToBytes(_stringFromRegistry1);
        bytes32 stringIdFromR2 = stringsRegistry2.stringToBytes(_stringFromRegistry2);
        bytes32 key = keccak256(abi.encodePacked(stringIdFromR1, stringIdFromR2));

        StringsLinkEntry storage entry = entryMap[key]; // entryMap
        entry.stringIdFromR1 = stringIdFromR1;
        entry.stringIdFromR2 = stringIdFromR2;
        entryKeyList.push(key);
        entry.entryKeyIndex = entryKeyList.length - 1; // entryKeyList
        stringR1ToStringR2[stringIdFromR1].push(key);
        entry.stringR1ToStringR2Index = stringR1ToStringR2[stringIdFromR1].length - 1; // stringR1ToStringR2
        stringR2ToStringR1[stringIdFromR2].push(key);
        entry.stringR2ToStringR1Index = stringR2ToStringR1[stringIdFromR2].length - 1; // stringR2ToStringR1

        entryKeyIndexMap[stringIdFromR1][stringIdFromR2] = key; // entryKeyIndexMap
    }

    function unlinkStrings(string memory _stringFromRegistry2, string memory _stringFromRegistry1)
    public
    onlyAllowedSender()
    {
        require(stringsRegistry1.contains(_stringFromRegistry1) && stringsRegistry2.contains(_stringFromRegistry2), 
            "one or both strings are not registered");
        require(isLinked(_stringFromRegistry2,_stringFromRegistry1), "address is not linked");

        bytes32 stringIdFromR1 = stringsRegistry1.stringToBytes(_stringFromRegistry1);
        bytes32 stringIdFromR2 = stringsRegistry2.stringToBytes(_stringFromRegistry2);
        bytes32 key = keccak256(abi.encodePacked(stringIdFromR1, stringIdFromR2));

        StringsLinkEntry storage entry = entryMap[key]; // entryMap

        // entryKeyList
        bytes32 lastKeyOfList = entryKeyList[entryKeyList.length - 1];
        entryMap[lastKeyOfList].entryKeyIndex = entry.entryKeyIndex;
        entryKeyList[entry.entryKeyIndex] = lastKeyOfList;
        entryKeyList.pop();

        // stringR1ToStringR2
        lastKeyOfList = stringR1ToStringR2[stringIdFromR1][stringR1ToStringR2[stringIdFromR1].length - 1];
        entryMap[lastKeyOfList].stringR1ToStringR2Index = entry.stringR1ToStringR2Index;
        stringR1ToStringR2[stringIdFromR1][entry.stringR1ToStringR2Index] = lastKeyOfList;
        stringR1ToStringR2[stringIdFromR1].pop();

        // stringR2ToStringR1
        lastKeyOfList = stringR2ToStringR1[stringIdFromR2][stringR2ToStringR1[stringIdFromR2].length - 1];
        entryMap[lastKeyOfList].stringR2ToStringR1Index = entry.stringR2ToStringR1Index;
        stringR2ToStringR1[stringIdFromR2][entry.stringR2ToStringR1Index] = lastKeyOfList;
        stringR2ToStringR1[stringIdFromR2].pop();

        // delete from entryKeyIndexMap
        delete entryKeyIndexMap[stringIdFromR1][stringIdFromR2];

        // delete from entryMap
        delete entryMap[key];
    }

    function isLinked(string memory _stringFromRegistry2, string memory _stringFromRegistry1)
    public
    view
    returns (bool)
    {
        bytes32 stringIdFromR1 = stringsRegistry1.stringToBytes(_stringFromRegistry1);
        bytes32 stringIdFromR2 = stringsRegistry2.stringToBytes(_stringFromRegistry2);
        return _isLinked(entryKeyIndexMap[stringIdFromR1][stringIdFromR2]);
    }

    function getLinksTotalCount()
    public
    view
    returns (uint)
    {
        return entryKeyList.length;
    }

    function getStringR1LinkedStringsR2Count(string memory _stringFromRegistry1)
    public
    view
    returns (uint)
    {
        bytes32 stringIdFromR1 = stringsRegistry1.stringToBytes(_stringFromRegistry1);
        return stringR1ToStringR2[stringIdFromR1].length;
    }

    function getStringR1LinkedStringsR2ByIndex(string memory _stringFromRegistry1, uint index)
    public
    view
    returns (string memory)
    {
        require(index >= 0 && index < getStringR1LinkedStringsR2Count(_stringFromRegistry1), "index out of bounds");
        bytes32 stringIdFromR1 = stringsRegistry1.stringToBytes(_stringFromRegistry1);
        bytes32 key = stringR1ToStringR2[stringIdFromR1][index];
        require(_isLinked(key), "entry must be present in map");

        StringsLinkEntry storage entry = entryMap[key];
        return stringsRegistry2.bytesToStringName(entry.stringIdFromR2);
    }

    function getStringR2LinkedStringsR1Count(string memory _stringFromRegistry2)
    public
    view
    returns (uint)
    {
        bytes32 stringIdFromR2 = stringsRegistry2.stringToBytes(_stringFromRegistry2);
        return stringR2ToStringR1[stringIdFromR2].length;
    }

    function getStringR2LinkedStringsR1ByIndex(string memory _stringFromRegistry2, uint index)
    public
    view
    returns (string memory)
    {
        require(index >= 0 && index < getStringR2LinkedStringsR1Count(_stringFromRegistry2), "index out of bounds");
        bytes32 stringIdFromR2 = stringsRegistry2.stringToBytes(_stringFromRegistry2);
        bytes32 key = stringR2ToStringR1[stringIdFromR2][index];
        require(_isLinked(key), "entry must be present in map");

        StringsLinkEntry storage entry = entryMap[key];
        return stringsRegistry1.bytesToStringName(entry.stringIdFromR1);
    }

    function _isLinked(bytes32 key)
    private
    pure
    returns (bool)
    {
        return key != 0;
    }
}