const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Transformation", function () {
    let proxy, transfoContract, product, storage, owner, transformateur, distributeur;

    beforeEach(async function () {

        [owner, transformateur, distributeur] = await ethers.getSigners();

        const ImplV1 = await ethers.getContractFactory("ImplementationV1");
        proxy = await upgrades.deployProxy(ImplV1.connect(owner), [], { initializer: "initialize", kind: "uups" });
        await proxy.waitForDeployment();

        await proxy.accorderRole(transformateur.address, await proxy.TRANSFORMATEUR_ROLE());
        await proxy.accorderRole(distributeur.address, await proxy.DISTRIBUTEUR_ROLE());

        const Product = await ethers.getContractFactory("ProductFactory");
        product = await upgrades.deployProxy(Product.connect(owner), [await proxy.getAddress()], {
            initializer: "initialize",
            kind: "uups",
        });
        await product.waitForDeployment();

        const StorageM = await ethers.getContractFactory("StorageContract");
        storage = await upgrades.deployProxy(StorageM.connect(owner), [await proxy.getAddress(), await product.getAddress()], {
            initializer: "initialize",
            kind: "uups",
        });
        await storage.waitForDeployment();

        const TransfoM = await ethers.getContractFactory("Transformation");
        transfoContract = await upgrades.deployProxy(TransfoM.connect(owner), [await proxy.getAddress(), await product.getAddress(), await storage.getAddress()], {
            initializer: "initialize",
            kind: "uups",
        });
        await transfoContract.waitForDeployment();

        const role = await proxy.TRANSFORMATEUR_ROLE();
        await proxy.accorderRole(transfoContract.target, role);

        await storage.connect(transformateur).creerStockage(15);

    });

    it("devrait déployer correctement tous les contrats", async function () {
        expect(await proxy.getAddress()).to.properAddress;
        expect(await product.getAddress()).to.properAddress;
        expect(await storage.getAddress()).to.properAddress;
        expect(await transfoContract.getAddress()).to.properAddress;
    });


    it("devrait effectuer une transfo complète correctement", async function () {
        // Créer des produits
        await product.connect(transformateur).addProduct("Blé", 100, "kg", "France", "Bio", Math.floor(Date.now() / 1000) + 10000);
        const produit0 = await product.produits(0);
        expect(produit0.nom).to.equal("Blé");
        expect(Number(produit0.quantite)).to.equal(100);
        expect(produit0.exist).to.be.true;

        await product.connect(transformateur).addProduct("Eau", 50, "L", "France", "Source", Math.floor(Date.now() / 1000) + 10000);
        const produit1 = await product.produits(1);
        expect(produit1.nom).to.equal("Eau");
        expect(Number(produit1.quantite)).to.equal(50);
        expect(produit1.exist).to.be.true;

        // Ajouter au stockage
        await storage.connect(transformateur).ajouterProduit(0, 0);
        await storage.connect(transformateur).ajouterProduit(0, 1);
        const stockageId0 = await storage.getStockageParProduit(0);
        const stockageId1 = await storage.getStockageParProduit(1);
        expect(Number(stockageId0)).to.equal(0);
        expect(Number(stockageId1)).to.equal(0);

        // Transformation
        const tx = await transfoContract.connect(transformateur).transformation(
            [0, 1],
            "Pâte",
            150,
            "kg",
            "France",
            "Artisanale",
            Math.floor(Date.now() / 1000) + 20000
        );


        const transformation = await transfoContract.getTransformation(0);
        expect(transformation.produitsEntree.map(n => Number(n))).to.deep.equal([0, 1]);
        expect(Number(transformation.produitSortie)).to.equal(2);
    });



    it("devrait compter correctement le nombre de transformations", async function () {

        let produitId;

        await product.connect(transformateur).addProduct("X", 1, "u", "Y", "Z", Math.floor(Date.now() / 1000) + 10000);
        produitId = (await product.getNextId()) - 1n;
        await storage.connect(transformateur).ajouterProduit(0, produitId);
        await transfoContract.connect(transformateur).transformation(
            [produitId], "Out", 1, "u", "Y", "Z", Math.floor(Date.now() / 1000) + 10000
        );

        await product.connect(transformateur).addProduct("X2", 1, "u", "Y", "Z", Math.floor(Date.now() / 1000) + 10000);
        produitId = (await product.getNextId()) - 1n;
        await storage.connect(transformateur).ajouterProduit(0, produitId);
        await transfoContract.connect(transformateur).transformation(
            [produitId], "Out2", 1, "u", "Y", "Z", Math.floor(Date.now() / 1000) + 10000
        );

        const count = await transfoContract.getNombreTransformations();
        expect(count).to.equal(2);
    });

    it("devrait vider le stockage des produits d'entrée et marquer les produits comme supprimés", async function () {
        // Créer deux produits
        await product.connect(transformateur).addProduct("Blé", 100, "kg", "France", "Bio", Math.floor(Date.now() / 1000) + 10000);
        await product.connect(transformateur).addProduct("Eau", 50, "L", "France", "Source", Math.floor(Date.now() / 1000) + 10000);

        // Ajouter au stockage
        await storage.connect(transformateur).ajouterProduit(0, 0);
        await storage.connect(transformateur).ajouterProduit(0, 1);

        // Vérification présence dans le stockage
        expect(await storage.getStockageParProduit(0)).to.equal(0);
        expect(await storage.getStockageParProduit(1)).to.equal(0);
        expect(await storage.getNbProduits(0)).to.equal(2);

        // Effectuer la transfo
        await transfoContract.connect(transformateur).transformation(
            [0, 1],
            "Pâte",
            150,
            "kg",
            "France",
            "Artisanale",
            Math.floor(Date.now() / 1000) + 20000
        );

        // Les produits d'entrée doivent être supprimés (exist == false)
        const p0 = await product.produits(0);
        const p1 = await product.produits(1);
        expect(p0.exist).to.be.false;
        expect(p1.exist).to.be.false;

        // Le stockage ne doit plus contenir les anciens produits
        expect(await storage.getNbProduits(0)).to.equal(1); // seul le nouveau produit
    });


});