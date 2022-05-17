pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title Certimio
 * @notice This contract aims to be managed by Certimio governance. Each project is free to propose to be listed, and then
 * to add its own trusted addresses.
 * @dev Contract to be owned by CertimioGovernance contract. Only this owner will be allowed to :
 * - List / unlist protocol's assets
 * - Add / remove allowed executors for each protocol if no allowedExecutor defined
 * - Add / remove trusted addresses for each protocol if no allowedExecutor defined
 * @author Certimio - hotmilk.eth
 **/
contract Certimio is Ownable {

    struct Assets {
        bool registered; // to check if the protocol is registered
        mapping(address => bool) allowedExecutors; // addresses allowed to add or remove protocol trusted assets
        mapping(address => bool) trustedAddresses; // contracts of the protocol
        mapping(string => bool) trustedDomains; // domain names of the protocol
    }

    mapping(string => Assets) public protocolAssets; // protocolID => assets

    // PUBLIC FUNCTIONS

    /**
    * @notice Add a new protocol to Certimio.
    * @dev Must be triggered by owner
    * @param _protocolID protocol identifier (e.g. "Trusted Protocol Assets")
    **/
    function registerProtocol(string memory _protocolID) public onlyOwner existingProtocol(_protocolID){
        require(!protocolAssets[_protocolID].registered, "Protocol already registered.");
        protocolAssets[_protocolID].registered = true;
    }

    /**
    * @notice Remove a protocol from Certimio.
    * @dev Must be triggered by owner
    * @param _protocolID protocol identifier (e.g. "Trusted Protocol Assets")
    **/
    function unregisterProtocol(string memory _protocolID) public onlyAllowedExecutors(_protocolID) existingProtocol(_protocolID) {
        delete protocolAssets[_protocolID];
    }

    /**
    * @notice Allow executor to manage protocol's assets.
    * @dev Governance contracts (or associated timelocks) are advised to be set as executors.
    * @param _executor address to allow
    **/
    function allowExecutor(address _executor) public onlyAllowedExecutors(_protocolID) existingProtocol(_protocolID){
        protocolAssets[_protocolID].allowedExecutors[_executor] = true;
    }

    /**
    * @notice Disallow executor to manage protocol's assets.
    * @dev Governance contracts (or associated timelocks) are advised to be set as executors.
    * @param _executor address to disallow
    **/
    function disallowExecutor(address _executor) public onlyAllowedExecutors(_protocolID) existingProtocol(_protocolID){
        protocolAssets[_protocolID].allowedExecutors[_executor] = true;
    }

    /**
    * @notice Add a trusted address to a registered protocol.
    * @dev Must be triggered by an allowed executor or by owner
    * @param _protocolID protocol identifier (e.g. "Trusted Protocol Assets")
    * @param _trustedAddress contract address to add to the trusted addresses list
    **/
    function addAddress(string memory _protocolID, address _trustedAddress) public onlyAllowedExecutors(_protocolID) existingProtocol(_protocolID) {
        protocolAssets[_protocolID].trustedAddresses[_trustedAddress] = true;
    }

    /**
    * @notice Add a trusted domain to a registered protocol.
    * @dev Must be triggered by an allowed executor or by owner
    * @param _protocolID protocol identifier (e.g. "Trusted Protocol Assets")
    * @param _trustedDomain domain to add to the trusted domains list (e.g. "trusted-protocol-assets.io")
    **/
    function addDomain(string memory _protocolID, address _trustedDomain) public onlyAllowedExecutors(_protocolID) existingProtocol(_protocolID) {
        protocolAssets[_protocolID].trustedDomains[_trustedDomain] = true;
    }

    /**
    * @notice Remove a trusted address from a registered protocol.
    * @dev Must be triggered by an allowed executor or by owner
    * @param _protocolID protocol identifier (e.g. "Trusted Protocol Assets")
    * @param _trustedAddress contract address to remove from the trusted addresses list
    **/
    function removeAddress(string memory _protocolID, address _untrustedAddress) public onlyAllowedExecutors(_protocolID) existingProtocol(_protocolID) {
        protocolAssets[_protocolID].trustedAddresses[_trustedAddress] = false;
    }

    /**
    * @notice Remove a trusted domain from a registered protocol.
    * @dev Must be triggered by an allowed executor or by owner
    * @param _protocolID protocol identifier (e.g. "Trusted Protocol Assets")
    * @param _trustedDomain domain to remove from the trusted domains list (e.g. "trusted-protocol-assets.io")
    **/
    function removeDomain(string memory _protocolID, address _untrustedDomain) public onlyAllowedExecutors(_protocolID) existingProtocol(_protocolID) {
        protocolAssets[_protocolID].trustedDomains[_trustedDomain] = false;
    }


    // MODIFIERS

    /**
    * @notice Modifier - Only allowed executors of the asset or the owner of this contract if none
    * @param _protocolID protocol identifier (e.g. "Trusted Protocol Assets")
    **/
    modifier onlyAllowedExecutors(string memory _protocolID) {
        require(protocolAssets[_protocolID].allowedExecutors.length > 0 ? 
            protocolAssets[_protocolID].allowedExecutors[msg.sender] : 
            msg.sender == owner, 
            "Sender is not an allowed executor."); 
        _;
    }

    /**
    * @notice Modifier - Only registered protocols
    * @param _protocolID protocol identifier (e.g. "Trusted Protocol Assets")
    **/
    modifier existingProtocol(string memory _protocolID) {
        require(protocolAssets[_protocolID].registered, "Protocol is not registered.");
        _;
    }
}