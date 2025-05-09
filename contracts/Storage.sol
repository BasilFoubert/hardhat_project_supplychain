// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IImplementationV1.sol";
import "./IProduct.sol";

contract StorageContract {

    struct Stockage {
        uint256 id;
        uint256[] products;
        int256 temperature;
        address responsable;
        bool actif;
    }

    IImplementationV1 private proxy;
    IProduct private productI;

    constructor(address _proxy, address _productI) {
        proxy = IImplementationV1(_proxy);
        productI = IProduct(_productI);
    }

    //MAPPING
    mapping(uint256 => Stockage) public stockages;

    //ID_COMMUN
    uint256 public nextStorageId;

    //MODIFIER
    modifier onlyWithRole() {
        require(
            proxy.hasRole(proxy.PRODUCTEUR_ROLE(), msg.sender) ||
            proxy.hasRole(proxy.TRANSFORMATEUR_ROLE(), msg.sender) ||
            proxy.hasRole(proxy.TRANSPORTEUR_ROLE(), msg.sender),
            "Acces refuse"
        );
        _;
    }

    //FONCTIONS

    function creerStockage(int256 _temp) external onlyWithRole {
        uint256[] memory tabVides = new uint256[](0);

        stockages[nextStorageId] = Stockage({
            id: nextStorageId,
            products: tabVides,
            temperature: _temp,
            responsable: msg.sender,
            actif: true
        });

        nextStorageId++;
    }

    function supprStockage(uint256 _stockageId) external onlyWithRole {
        require(stockages[_stockageId].actif, "Stockage deja inactif");
        require(stockages[_stockageId].responsable == msg.sender, "Non autorise");
        require(stockages[_stockageId].products.length == 0, "Stockage non vide");
        stockages[_stockageId].actif = false;
    }


    function getNbProduits(uint256 _stockageId) external view returns (uint256) {
        return stockages[_stockageId].products.length;
    }

    function ajouterProduit(uint256 _stockageId, uint256 _produitId) external onlyWithRole {
        require(stockages[_stockageId].actif, "Stockage inactif");
        (,,,,,,,,,,, bool exist) = productI.produits(_produitId);
        require(exist, "Produit innexistant");

        stockages[_stockageId].products.push(_produitId);
    }

    function retirerProduit(uint256 _stockageId, uint256 _produitId) external onlyWithRole {
        uint256[] storage produitsStockes = stockages[_stockageId].products;

        for (uint256 i = 0; i < produitsStockes.length; i++) {
            if (produitsStockes[i] == _produitId) {
                produitsStockes[i] = produitsStockes[produitsStockes.length - 1]; 
                produitsStockes.pop(); 
                break;
            }
        }
    }
}