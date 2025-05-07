// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IProduct {
    function produits(uint256 _id) external view returns (
        uint256 id,
        address proprietaire,
        string memory nom,
        uint256 quantite,
        string memory unite,
        string memory origine,
        string memory certification,
        uint256 dateProd,
        uint256 datePer,
        bool enVente,
        uint256 prix,
        bool exist
    );
}