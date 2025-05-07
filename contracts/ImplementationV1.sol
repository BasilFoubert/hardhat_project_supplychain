// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract ImplementationV1 is Initializable, OwnableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    uint256 private value;

    /*Nos variables*/
    bytes32 public constant PRODUCTEUR_ROLE = keccak256("PRODUCTEUR_ROLE");
    bytes32 public constant TRANSFORMATEUR_ROLE = keccak256("TRANSFORMATEUR_ROLE");
    bytes32 public constant TRANSPORTEUR_ROLE = keccak256("TRANSPORTEUR_ROLE");
    bytes32 public constant DISTRIBUTEUR_ROLE = keccak256("DISTRIBUTEUR_ROLE");

    event RoleDemande(address indexed demandeur, bytes32 role, bytes32 siret);

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __AccessControl_init();
        
        value = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    function setValue(uint256 _value) public onlyOwner {
        value = _value;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}

    /*Nos fonctions*/
    function demanderRole(bytes32 role, bytes32 siret) external {
        emit RoleDemande(msg.sender, role, siret);
    }

    function accorderRole(address user, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(role, user);
    } 
}