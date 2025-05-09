// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IStorage {
    function creerStockage(int256 _temp) external;
    function supprStockage(uint256 _stockageId) external;
    function getNbProduits(uint256 _stockageId) external view returns (uint256);
    function ajouterProduit(uint256 _stockageId, uint256 _produitId) external;
    function retirerProduit(uint256 _stockageId, uint256 _produitId) external;
    function getStockageParProduit(uint256 _produitId) external view returns (uint256);
}