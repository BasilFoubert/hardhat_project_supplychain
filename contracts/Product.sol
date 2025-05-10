// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IImplementationV1.sol";

contract ProductFactory {
    struct Product {
        uint256 id;
        address proprietaire;
        string nom;
        uint256 quantite;
        string unite;
        string origine;
        string certification;
        uint256 dateProd;
        uint256 datePer;
        bool enVente;
        uint256 prix;
        bool exist;
    }

    //MAPPING 
    mapping(uint256 => Product) public produits;

    //On peut opti la mise en vente avec un array si on veut

    //PROXY
    address public proxyContract;

    //VARIABLE COMMUNE
    uint256 public nextId;

    //EVENTS
    event ProduitCree(uint256 id, string nom, address createur);
    event ProduitAchete(uint256 id, address ancienProprio, address newProprio);
    event ProduitSupprime(uint256 id);
    event ProduitMisEnVente(uint256 id, string nom, uint256 prix);

    constructor(address _proxy) {
        proxyContract = _proxy;
    }

    //MODIFIER

    modifier onlyAuthorizedCreate() {
        IImplementationV1 proxy = IImplementationV1(proxyContract);
        require(
            proxy.hasRole(proxy.PRODUCTEUR_ROLE(), msg.sender) || 
            proxy.hasRole(proxy.TRANSFORMATEUR_ROLE(), msg.sender),
            "Non autorise"
        );
        _;
    }

    modifier onlyAuthorizedDelete() {
        IImplementationV1 proxy = IImplementationV1(proxyContract);
        require(
            proxy.hasRole(proxy.DISTRIBUTEUR_ROLE(), msg.sender) || 
            proxy.hasRole(proxy.TRANSFORMATEUR_ROLE(), msg.sender),
            "Non autorise"
        );
        _;
    }

    modifier onlyAuthorizedBuy() {
        IImplementationV1 proxy = IImplementationV1(proxyContract);
        require(
            proxy.hasRole(proxy.DISTRIBUTEUR_ROLE(), msg.sender) || 
            proxy.hasRole(proxy.TRANSFORMATEUR_ROLE(), msg.sender),
            "Non autorise"
        );
        _;
    }

    modifier produitExist(uint256 _id) {
        require(produits[_id].exist, "Produit vendu ou transforme");
        _;
    }


    //FONCTIONS

    function addProduct(
        string memory nom,
        uint256 quantite,
        string memory unite,
        string memory origine,
        string memory certification,
        uint256 datePer
    ) external onlyAuthorizedCreate {
        produits[nextId] = Product({
            id: nextId,
            proprietaire: msg.sender,
            nom: nom,
            quantite: quantite,
            unite: unite,
            origine: origine,
            certification: certification,
            dateProd: block.timestamp,
            datePer: datePer,
            enVente: false,
            prix: 0,
            exist: true
        });

        emit ProduitCree(nextId, nom, msg.sender);
        nextId++;
    }

    function deleteProd(uint256 _id) external onlyAuthorizedDelete produitExist(_id) {
        produits[_id].exist = false;
        emit ProduitSupprime(_id);
    }

    function mettreEnVente(uint256 _id, uint256 prix) external produitExist(_id) {
        require(produits[_id].proprietaire == msg.sender, "Pas proprietaire");
        produits[_id].enVente = true;
        produits[_id].prix = prix;
        emit ProduitMisEnVente(_id, produits[_id].nom ,prix);
    }

    function acheterProduit(uint256 _id) external payable produitExist(_id) onlyAuthorizedBuy {
        require(produits[_id].enVente, "Pas en vente");
        require(produits[_id].proprietaire != msg.sender, "Deja proprietaire");
        require(msg.value >= produits[_id].prix, "Prix insuffisant");

        address payable ancienProprio = payable(produits[_id].proprietaire);
        produits[_id].proprietaire = msg.sender;
        produits[_id].enVente = false;
        produits[_id].prix = 0;

        (bool success, ) = ancienProprio.call{value: msg.value}("");
        require(success, "Paiement echoue");

        emit ProduitAchete(_id, ancienProprio, msg.sender);
    }

    function getProduitsEnVente() external view returns (Product[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextId; i++) {
            if (produits[i].enVente && produits[i].exist) {
                count++;
            }
        }

        Product[] memory enVente = new Product[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < nextId; i++) {
            if (produits[i].enVente && produits[i].exist) {
                enVente[index] = produits[i];
                index++;
            }
        }
        return enVente;
    }

    function getNextId() external view returns (uint256) {
        return nextId;
    }

}