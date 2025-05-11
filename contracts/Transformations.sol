// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./IImplementationV1.sol";
import "./IProduct.sol";
import "./IStorage.sol";

contract Transformation is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    struct TransformationStruct {
        uint256[] produitsEntree;
        uint256 produitSortie;
    }

    TransformationStruct[] public transformations;

    IImplementationV1 private proxy;
    IProduct private productContract;
    IStorage private storageContract;

    event TransformationEffectuee(
        uint256 indexed index,
        uint256[] produitsEntree,
        uint256 produitSortie
    );

    function initialize(address _proxy, address _productAddress, address _storageAddress) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        proxy = IImplementationV1(_proxy);
        productContract = IProduct(_productAddress);
        storageContract = IStorage(_storageAddress);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier onlyTransformateur() {
        require(
            proxy.hasRole(proxy.TRANSFORMATEUR_ROLE(), msg.sender),
            "Acces refuse"
        );
        _;
    }

    function enregistrerTransformation (
        uint256[] memory _produitsEntree,
        uint256 _produitSortie
    ) internal onlyTransformateur {
        TransformationStruct memory nouvelleTransformation = TransformationStruct({
            produitsEntree: _produitsEntree,
            produitSortie: _produitSortie
        });

        transformations.push(nouvelleTransformation);

        emit TransformationEffectuee(
            transformations.length - 1,
            _produitsEntree,
            _produitSortie
        );
    }


    function transformation(
        uint256[] memory _produitsEntree,
        string memory nomProduitSortie,
        uint256 quantite,
        string memory unite,
        string memory origine,
        string memory certification,
        // uint256 dateProd,
        uint256 datePer
        // bool enVente,
        // uint256 prix,
        // bool exist
    ) external onlyTransformateur {
        require(
            proxy.hasRole(proxy.PRODUCTEUR_ROLE(), msg.sender) ||
            proxy.hasRole(proxy.TRANSFORMATEUR_ROLE(), msg.sender),
            "Droit manquant pour manipulation produit"
        );

        for (uint i = 0; i < _produitsEntree.length; i++) {
            (, address proprietaire, , , , , , , , , , bool exist) = productContract.produits(_produitsEntree[i]);
            require(exist, "Produit inexistant");
            require(proprietaire == msg.sender, "Pas le proprietaire du produit");
        }


        for (uint i = 0; i < _produitsEntree.length; i++) {
            // retirer produit du storage
            uint256 stockageId = storageContract.getStockageParProduit(_produitsEntree[i]);
            storageContract.retirerProduit(stockageId, _produitsEntree[i]);

            // supprimer le produit
            productContract.deleteProd(_produitsEntree[i]);
        }

        // créer produit
        productContract.addProduct(
            nomProduitSortie,
            quantite,
            unite,
            origine,
            certification,
            datePer
        );

        // obtenir l'ID du produit créé
        uint256 produitSortieId = productContract.getNextId() - 1;

        // ajouter produit au stockage
                // ajouter produit au stockage (le même que le premier produit d'entrée)
        if (_produitsEntree.length > 0) {
            uint256 stockageCible = storageContract.getStockageParProduit(_produitsEntree[0]);
            storageContract.ajouterProduit(stockageCible, produitSortieId);
        }

        enregistrerTransformation(_produitsEntree, produitSortieId);
    }


    function getTransformation(uint256 index) external view returns (
        uint256[] memory produitsEntree,
        uint256 produitSortie
    ) {
        TransformationStruct memory t = transformations[index];
        return (t.produitsEntree, t.produitSortie);
    }

    function getNombreTransformations() external view returns (uint256) {
        return transformations.length;
    }
}