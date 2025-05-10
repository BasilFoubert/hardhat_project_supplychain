const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Transformation", function () {
    let proxy, transformation, product, storage, owner, transformateur, user;

    beforeEach(async function () {
        [owner, transformateur, user] = await ethers.getSigners();

        const ImplV1 = await ethers.getContractFactory("ImplementationV1");
        proxy = await upgrades.deployProxy(ImplV1, [], { initializer: "initialize", kind: "uups" });
        await proxy.waitForDeployment();

        // Donner des rôles pour les tests
        const role = await proxy.TRANSFORMATEUR_ROLE();
        await proxy.accorderRole(owner.address, role);
        await proxy.accorderRole(user.address, await proxy.TRANSFORMATEUR_ROLE());
        await proxy.accorderRole(user.address, await proxy.DISTRIBUTEUR_ROLE());
        await proxy.accorderRole(transformateur.address, role);

        // Déploiement de ProductFactory
        const ProductFactory = await ethers.getContractFactory("ProductFactory");
        product = await ProductFactory.deploy(await proxy.getAddress());
        await product.waitForDeployment();

        const StorageContract = await ethers.getContractFactory("StorageContract");
        storage = await StorageContract.deploy(await proxy.getAddress(), await product.getAddress());
        await storage.waitForDeployment();

        const Transformation = await ethers.getContractFactory("Transformation");
        transformation = await Transformation.deploy(
            await proxy.getAddress(),
            await product.getAddress(),
            await storage.getAddress()
        );
        await transformation.waitForDeployment();
        await proxy.accorderRole(transformation.target, role);

        await storage.connect(transformateur).creerStockage(15);
    });

    it("devrait déployer correctement tous les contrats", async function () {
        expect(await proxy.getAddress()).to.properAddress;
        expect(await product.getAddress()).to.properAddress;
        expect(await storage.getAddress()).to.properAddress;
        expect(await transformation.getAddress()).to.properAddress;
    });


    it("devrait effectuer une transformation complète correctement", async function () {
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
        const tx = await transformation.connect(transformateur).transformation(
            [0, 1],
            "Pâte",
            150,
            "kg",
            "France",
            "Artisanale",
            Math.floor(Date.now() / 1000) + 20000
        );

        console.log("TX hash:", tx.hash);

        const transfo = await transformation.getTransformation(0);
        expect(transfo.produitsEntree.map(n => Number(n))).to.deep.equal([0, 1]);
        expect(Number(transfo.produitSortie)).to.equal(2);
    });



    it("devrait compter correctement le nombre de transformations", async function () {
        await product.connect(transformateur).addProduct("X", 1, "u", "Y", "Z", Math.floor(Date.now() / 1000) + 10000);
        await storage.connect(transformateur).ajouterProduit(0, 0);
        await transformation.connect(transformateur).transformation(
            [0], "Out", 1, "u", "Y", "Z", Math.floor(Date.now() / 1000) + 10000
        );

        await product.connect(transformateur).addProduct("X2", 1, "u", "Y", "Z", Math.floor(Date.now() / 1000) + 10000);
        await storage.connect(transformateur).ajouterProduit(0, 1);
        await transformation.connect(transformateur).transformation(
            [1], "Out2", 1, "u", "Y", "Z", Math.floor(Date.now() / 1000) + 10000
        );

        const count = await transformation.getNombreTransformations();
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

        // Effectuer la transformation
        await transformation.connect(transformateur).transformation(
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