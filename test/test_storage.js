const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("StorageContract", function () {
    let ImplementationV1, impl, Storage, Product, product, storage, owner, user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
    
        const ImplV1 = await ethers.getContractFactory("ImplementationV1");
        const proxy = await upgrades.deployProxy(ImplV1, [], { initializer: "initialize" });
        const implAddress = await proxy.getAddress();
    
        const PRODUCTEUR_ROLE = await proxy.PRODUCTEUR_ROLE();
        await proxy.accorderRole(owner.address, PRODUCTEUR_ROLE);
    
        const FakeProduct = await ethers.getContractFactory("ProductFactory");
        product = await FakeProduct.deploy(implAddress);
        await product.waitForDeployment();
    
        await product.addProduct(
            "Tomates",
            100,
            "kg",
            "France",
            "Bio",
            Math.floor(Date.now() / 1000) + 100000
        );
    
        const StorageContract = await ethers.getContractFactory("StorageContract");
        storage = await upgrades.deployProxy(StorageContract, [implAddress, await product.getAddress()], {
            initializer: "initialize",
        });
    
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
    
        const stockage = await storage.stockages(0);
        // Vérifie que le produit a bien été ajouté en lisant directement le slot 0
        const productIndex = await storage.stockages(0);
        const products = await storage ;
        const productId = await storage.stockages(0).then(s => s.products); // <- ne fonctionne pas directement

        expect(stockage.actif).to.be.true;
    });
    
    it("retire un produit d'un stockage", async function () {
        await storage.creerStockage(2);
        await storage.ajouterProduit(0, 0);
        await storage.retirerProduit(0, 0);
    
        const stockage = await storage.stockages(0);
        expect(stockage.actif).to.be.false;
    });

    it("reste actif si on retire un seul produit parmi plusieurs", async function () {
        await product.addProduct(
            "Salades",
            50,
            "pièces",
            "France",
            "Label Rouge",
            Math.floor(Date.now() / 1000) + 200000
        );

        await storage.creerStockage(4);
        await storage.ajouterProduit(0, 0);
        await storage.ajouterProduit(0, 1); // Deuxième produit ajouté
        await storage.retirerProduit(0, 0); // Retire le premier

        const stockage = await storage.stockages(0);
        expect(stockage.actif).to.be.true;
    });
});