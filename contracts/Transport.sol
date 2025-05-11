// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./IImplementationV1.sol";
import "./IProduct.sol";

contract Transport is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    struct TransportStruct {
        address envoyeur;
        address recepteur;
        uint256[] produitsT;
        int256 temperatureTransport;
        uint256 dateLivraison;
        uint256 dateReception;
    }

    TransportStruct[] public transports;

    IImplementationV1 private proxy;
    IProduct private productI;

    event TransportEffectue(
        address indexed envoyeur,
        address indexed recepteur,
        uint256[] produitsT,
        int256 temperature,
        uint256 dateLivraison,
        uint256 dateReception
    );

    function initialize(address _proxy, address _productAddress) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        proxy = IImplementationV1(_proxy);
        productI = IProduct(_productAddress);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier onlyWithRole() {
        require(
            proxy.hasRole(proxy.TRANSPORTEUR_ROLE(), msg.sender),
            "Acces refuse"
        );
        _;
    }

    function enregistrerTransport(
        address _envoyeur,
        address _recepteur,
        uint256[] memory _produitsT,
        int256 _temperatureTransport,
        uint256 _dateLivraison
    ) external onlyWithRole {

        //Verif que les produits appartiennent bien au receveur
        for (uint i = 0; i < _produitsT.length; i++) {
            (, address proprio, , , , , , , , , , bool exist) = productI.produits(_produitsT[i]);
            require(exist, "Produit inexistant");
            require(proprio == _recepteur, "Le produit n'appartient pas au receveur");
        }

        transports.push(TransportStruct({
            envoyeur: _envoyeur,
            recepteur: _recepteur,
            produitsT: _produitsT,
            temperatureTransport: _temperatureTransport,
            dateLivraison: _dateLivraison,
            dateReception: block.timestamp
        }));

        emit TransportEffectue(
            _envoyeur,
            _recepteur,
            _produitsT,
            _temperatureTransport,
            _dateLivraison,
            block.timestamp
        );
    }

    function getTransport(uint256 index) external view returns (
        address envoyeur,
        address recepteur,
        uint256[] memory produitsT,
        int256 temperatureTransport,
        uint256 dateLivraison,
        uint256 dateReception
    ) {
        TransportStruct memory t = transports[index];
        return (
            t.envoyeur,
            t.recepteur,
            t.produitsT,
            t.temperatureTransport,
            t.dateLivraison,
            t.dateReception
        );
    }

    function getNombreTransports() external view returns (uint256) {
        return transports.length;
    }

    function getNomProduitsTransportes(uint256 transportIndex)
        external
        view
        returns (string[] memory noms) {

        TransportStruct memory t = transports[transportIndex];
        noms = new string[](t.produitsT.length);

        for (uint i = 0; i < t.produitsT.length; i++) {
            (, , string memory nom, , , , , , , , ,) = productI.produits(t.produitsT[i]);
            noms[i] = nom;
        }
    }
}