// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ExecutorsRegistry is Ownable {

    struct Executor {
        uint index;
        bool exists;
    }
    
    mapping(address => Executor) public executorsMap; // address => index in the list
    address[] public executorsList;

    function add(address _executorAddress) public onlyOwner {
        Executor storage entry = executorsMap[_executorAddress];
        require(!_contains(entry), "executor already in map");

        executorsList.push(_executorAddress);
        entry.index = executorsList.length - 1;
        entry.exists = true;
    }

    function remove(address _executorAddress) public onlyOwner {
        Executor storage entry = executorsMap[_executorAddress];
        require(_contains(entry), "executorAddress must be present in map");
        require(_isInRange(entry.index), "index must be in range");
        uint256 deleteEntryIndex = entry.index;

        // Move last element into the delete key slot.
        uint256 lastEntryIndex = executorsList.length - 1;
        address lastEntryExecutorAddress = executorsList[lastEntryIndex];
        executorsMap[lastEntryExecutorAddress].index = deleteEntryIndex; // executorsMap
        executorsList[deleteEntryIndex] = executorsList[lastEntryIndex]; // executorsList
        executorsList.pop();
        delete executorsMap[_executorAddress];
    }

    function getByIndex(uint _index) public view returns (address _executorAddress) {
        require(_isInRange(_index), "index must be in range");

        return executorsList[_index];
    }

    function getExecutorId(address _executorAddress) public view returns (uint index, bool exists) {
        Executor storage entry = executorsMap[_executorAddress];
        require(_contains(entry), "executorAddress must be present in map");

        return (entry.index, entry.exists);
    }

    function size() public view returns (uint) {
        return executorsList.length;
    }

    function contains(address _executorAddress) public view returns (bool) {
        Executor storage entry = executorsMap[_executorAddress];
        return _contains(entry);
    }

    function _contains(Executor memory _entry) private pure returns (bool){
        return _entry.exists;
    }

    function _isInRange(uint256 _index) private view returns (bool) {
        return (_index >= 0) && (_index < executorsList.length);
    }
}