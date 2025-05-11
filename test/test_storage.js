const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("StorageContract", function () {
    let ImplementationV1, impl, Storage, Product, product, storage, owner, user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
    
        const ImplV1 = await ethers.getContractFactory("ImplementationV1");
        const proxy = await upgrades.deployProxy(ImplV1.connect(owner), [], { initializer: "initialize" });
        const implAddress = await proxy.getAddress();
    
        const PRODUCTEUR_ROLE = await proxy.PRODUCTEUR_ROLE();
        await proxy.accorderRole(owner.address, PRODUCTEUR_ROLE);
    
        const Product = await ethers.getContractFactory("ProductFactory");
            product = await upgrades.deployProxy(Product.connect(owner), [await proxy.getAddress()], {
            initializer: "initialize",
            kind: "uups",
        });
        await product.waitForDeployment();
    
        await product.addProduct(
            "Tomates",
            100,
            "kg",
            "France",
            "Bio",
            Math.floor(Date.now() / 1000) + 100000
        );
    
       const StorageM = await ethers.getContractFactory("StorageContract");
            storage = await upgrades.deployProxy(StorageM.connect(owner), [await proxy.getAddress(), await product.getAddress()], {
            initializer: "initialize",
            kind: "uups",
        });
        await storage.waitForDeployment();
    
        const productAddress = await product.getAddress();
        const storageAddress = await storage.getAddress();
    
        expect(implAddress).to.properAddress;
        expect(productAddress).to.properAddress;
        expect(storageAddress).to.properAddress;
    });

    it("crée un stockage correctement", async function () {
        const temp = 5;
        await storage.creerStockage(temp);
        const stockage = await storage.stockages(0);
        expect(stockage.temperature).to.equal(temp); // ← valeur cohérente
        expect(stockage.responsable).to.equal(owner.address);
        expect(stockage.actif).to.be.true;
    });

    it("ajoute un produit à un stockage", async function () {
        await storage.creerStockage(18);
        await storage.ajouterProduit(0, 0);

        const nbProduits = await storage.getNbProduits(0);
        expect(nbProduits).to.equal(1);

        const stockage = await storage.stockages(0);
        expect(stockage.actif).to.be.true;
    });
    
    it("retire un produit d'un stockage", async function () {
        await storage.creerStockage(2);
        await storage.ajouterProduit(0, 0);
        await storage.retirerProduit(0, 0);

        const stockage = await storage.stockages(0);
        const produits = await storage.getNbProduits(0);

        expect(produits).to.equal(0);
        expect(stockage.actif).to.be.true;
    });

    it("associe correctement un produit à un stockage", async function () {
        await storage.creerStockage(10);
        await storage.ajouterProduit(0, 0);

        const stockageId = await storage.getStockageParProduit(0);
        expect(stockageId).to.equal(0);
    });

    

    it("rend le stockage inactif après suppression explicite", async function () {
        await storage.creerStockage(2);
        const stockageAvant = await storage.stockages(0);
        expect(stockageAvant.actif).to.be.true;

        const produitsAvant = await storage.getNbProduits(0);
        expect(produitsAvant).to.equal(0);

        await storage.supprStockage(0);
        const stockageApres = await storage.stockages(0);
        expect(stockageApres.actif).to.be.false;
    });

    it("empeche la suppression si le stockage contient encore des produits", async function () {
        await storage.creerStockage(2);
        await storage.ajouterProduit(0, 0);

        await expect(storage.supprStockage(0)).to.be.revertedWith("Stockage non vide");
    });

    
});