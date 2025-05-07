// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IImplementationV1.sol";

contract ActeurContract {

    enum TypeActeur { Producteur, Transformateur, Distributeur, Transporteur }

    struct Acteur {
        address wallet;
        string nom;
        string secteur;
        uint256 numSiret;
        string email;
        bool actif;
    }

    mapping(address => Acteur) public acteurs;

    IImplementationV1 private proxy;

    constructor(address _proxy) {
        proxy = IImplementationV1(_proxy);
    }

    modifier onlyWithRole() {
        require(
            proxy.hasRole(proxy.PRODUCTEUR_ROLE(), msg.sender) ||
            proxy.hasRole(proxy.TRANSFORMATEUR_ROLE(), msg.sender) ||
            proxy.hasRole(proxy.TRANSPORTEUR_ROLE(), msg.sender) ||
            proxy.hasRole(proxy.DISTRIBUTEUR_ROLE(), msg.sender),
            "Acces refuse"
        );
        _;
    }

    modifier inscrit() {
        require(acteurs[msg.sender].actif ,"Vous n'etes pas inscrit");
        _;
    }

    function enregistrerActeur(
    string memory _nom,
    string memory _secteur,
    uint256 _numeroSiret,
    string memory _contact) external onlyWithRole() {

        require(!acteurs[msg.sender].actif, "Acteur deja enregistre");

        acteurs[msg.sender] = Acteur(
            msg.sender,
            _nom,
            _secteur,
            _numeroSiret,
            _contact,
            true
        );
    }
}