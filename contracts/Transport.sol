// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./IImplementationV1.sol";

contract Transport is Initializable {
    struct TransportStruct {
        address envoyeur;
        address recepteur;
        int256 temperatureTransport;
        uint256 dateLivraison;
        uint256 dateReception;
    }

    TransportStruct[] public transports;

    IImplementationV1 private proxy;

    event TransportEffectue(
        address indexed envoyeur,
        address indexed recepteur,
        int256 temperature,
        uint256 dateLivraison,
        uint256 dateReception
    );


    function initialize(address _proxy) public initializer {
        proxy = IImplementationV1(_proxy);
    }

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
        int256 _temperatureTransport,
        uint256 _dateLivraison
    ) external onlyWithRole {
        transports.push(TransportStruct({
            envoyeur: _envoyeur,
            recepteur: _recepteur,
            temperatureTransport: _temperatureTransport,
            dateLivraison: _dateLivraison,
            dateReception: block.timestamp
        }));

        emit TransportEffectue(
            _envoyeur,
            _recepteur,
            _temperatureTransport,
            _dateLivraison,
            block.timestamp
        );
    }

    function getTransport(uint256 index) external view returns (
        address envoyeur,
        address recepteur,
        int256 temperatureTransport,
        uint256 dateLivraison,
        uint256 dateReception
    ) {
        TransportStruct memory t = transports[index];
        return (
            t.envoyeur,
            t.recepteur,
            t.temperatureTransport,
            t.dateLivraison,
            t.dateReception
        );
    }

    function getNombreTransports() external view returns (uint256) {
        return transports.length;
    }
}