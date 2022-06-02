// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "../Registries/ExecutorsRegistry.sol";
import "../Registries/ProtocolsRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProtocolExecutor is Ownable {
    struct ProtocolExecutorEntry{
        address executorAddress;
        bytes32 protocolId;
        uint entryKeyIndex;
        uint executorToProtocolIndex;
        uint protocolToExecutorIndex;
    }
    mapping(bytes32 => ProtocolExecutorEntry) public entryMap;
    mapping(address => mapping(bytes32 => bytes32)) public executorToProtocolMap; // Executor + Protocol => key of entryMap

    bytes32[] public entryKeyList; // key list of entryMap
    mapping(address => bytes32[]) public executorToProtocolListMap; // Executor => key list of entryMap
    mapping(bytes32 => bytes32[]) public protocolToExecutorListMap; // Protocol => key list of entryMap

    ExecutorsRegistry executorsRegistry;
    ProtocolsRegistry protocolsRegistry;

    constructor(address _executorsRegistryAddress, address _protocolsRegistryAddress) {
        executorsRegistry = ExecutorsRegistry(_executorsRegistryAddress);
        protocolsRegistry = ProtocolsRegistry(_protocolsRegistryAddress);
    }

    function allowExecutor(address _executorAddress, string memory _protocolName) 
    public
    onlyOwner()
    {
        require(protocolsRegistry.contains(_protocolName), "protocol not registered");
        require(!isAllowed(_executorAddress,_protocolName), "executor is already allowed");

        bytes32 protocolId = protocolsRegistry.protocolNameToBytes(_protocolName);
        bytes32 key = keccak256(abi.encodePacked(_executorAddress, protocolId));

        ProtocolExecutorEntry storage entry = entryMap[key]; // entryMap
        entry.executorAddress = _executorAddress;
        entry.protocolId = protocolId;
        entryKeyList.push(key);
        entry.entryKeyIndex = entryKeyList.length - 1; // entryKeyList
        executorToProtocolListMap[_executorAddress].push(key);
        entry.executorToProtocolIndex = executorToProtocolListMap[_executorAddress].length - 1; // executorToProtocolListMap
        protocolToExecutorListMap[protocolId].push(key);
        entry.protocolToExecutorIndex = protocolToExecutorListMap[protocolId].length - 1; // protocolToExecutorListMap

        executorToProtocolMap[_executorAddress][protocolId] = key; // executorToProtocolMap

        // add executor address to registry if not present
        if(!executorsRegistry.contains(_executorAddress)) {
            executorsRegistry.add(_executorAddress);
        }
    }

    function disallowExecutor(address _executorAddress, string memory _protocolName)
    public
    onlyOwner()
    {
        require(protocolsRegistry.contains(_protocolName), "protocol not registered");
        require(isAllowed(_executorAddress,_protocolName), "executor is not allowed");


        bytes32 protocolId = protocolsRegistry.protocolNameToBytes(_protocolName);
        bytes32 key = executorToProtocolMap[_executorAddress][protocolId];

        ProtocolExecutorEntry storage entry = entryMap[key]; // entryMap

        // entryKeyList
        bytes32 lastKeyOfList = entryKeyList[entryKeyList.length - 1];
        entryMap[lastKeyOfList].entryKeyIndex = entry.entryKeyIndex;
        entryKeyList[entry.entryKeyIndex] = lastKeyOfList;
        entryKeyList.pop();

        // executorToProtocolListMap
        lastKeyOfList = executorToProtocolListMap[_executorAddress][executorToProtocolListMap[_executorAddress].length - 1];
        entryMap[lastKeyOfList].executorToProtocolIndex = entry.executorToProtocolIndex;
        executorToProtocolListMap[_executorAddress][entry.executorToProtocolIndex] = lastKeyOfList;
        executorToProtocolListMap[_executorAddress].pop();

        // protocolToExecutorListMap
        lastKeyOfList = protocolToExecutorListMap[protocolId][protocolToExecutorListMap[protocolId].length - 1];
        entryMap[lastKeyOfList].protocolToExecutorIndex = entry.protocolToExecutorIndex;
        protocolToExecutorListMap[protocolId][entry.protocolToExecutorIndex] = lastKeyOfList;
        protocolToExecutorListMap[protocolId].pop();

        // delete from executorToProtocolMap
        delete executorToProtocolMap[_executorAddress][protocolId];

        // delete from entryMap
        delete entryMap[key];

        // delete executor address to registry if no remaining linked protocol
        if(getAllowedProtocolCount(_executorAddress) == 0) {
            executorsRegistry.remove(_executorAddress);
        }
    }

    function isAllowed(address _executorAddress, string memory _protocolId)
    public
    view
    returns (bool)
    {
        bytes32 protocolId = protocolsRegistry.protocolNameToBytes(_protocolId);
        return _isAllowed(executorToProtocolMap[_executorAddress][protocolId]);
    }

    function getRelationsTotalCount()
    public
    view
    returns (uint)
    {
        return entryKeyList.length;
    }

    function getAllowedProtocolCount(address _executorAddress)
    public
    view
    returns (uint)
    {
        return executorToProtocolListMap[_executorAddress].length;
    }

    function getAllowedProtocolId(address _executorAddress, uint index)
    public
    view
    returns (string memory)
    {
        bytes32 key = executorToProtocolListMap[_executorAddress][index];
        require(_isAllowed(key), "entry must be present in map");

        ProtocolExecutorEntry storage entry = entryMap[key];
        return protocolsRegistry.bytesToProtocolName(entry.protocolId);
    }

    function getAllowedExecutorCount(string memory _protocolId)
    public
    view
    returns (uint)
    {
        bytes32 protocolId = protocolsRegistry.protocolNameToBytes(_protocolId);
        return protocolToExecutorListMap[protocolId].length;
    }

    function getAllowedExecutorId(string memory _protocolId, uint index)
    public
    view
    returns (address)
    {
        bytes32 protocolId = protocolsRegistry.protocolNameToBytes(_protocolId);
        bytes32 key = protocolToExecutorListMap[protocolId][index];
        require(_isAllowed(key), "entry must be present in map");

        ProtocolExecutorEntry storage entry = entryMap[key];
        return entry.executorAddress;
    }

    function _isAllowed(bytes32 key)
    private
    pure
    returns (bool)
    {
        return key != 0;
    }
}