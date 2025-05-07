// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IImplementationV1 {
    function hasRole(bytes32 role, address account) external view returns (bool);
    function PRODUCTEUR_ROLE() external view returns (bytes32);
    function TRANSFORMATEUR_ROLE() external view returns (bytes32);
    function TRANSPORTEUR_ROLE() external view returns (bytes32);
    function DISTRIBUTEUR_ROLE() external view returns (bytes32);
}
