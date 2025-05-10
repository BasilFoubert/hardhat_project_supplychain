const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ProductFactory", function () {
  let owner, user, autre;
  let proxy, productFactory;

  beforeEach(async function () {
    [owner, user, autre] = await ethers.getSigners();

    // Déploiement du proxy avec ImplementationV1
    const ImplV1 = await ethers.getContractFactory("ImplementationV1");
    proxy = await upgrades.deployProxy(ImplV1, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await proxy.waitForDeployment();

    // Donner des rôles pour les tests
    const role = await proxy.PRODUCTEUR_ROLE();
    await proxy.accorderRole(owner.address, role);
    await proxy.accorderRole(user.address, await proxy.TRANSFORMATEUR_ROLE());
    await proxy.accorderRole(user.address, await proxy.DISTRIBUTEUR_ROLE());

    // Déploiement de ProductFactory
    const ProductFactory = await ethers.getContractFactory("ProductFactory");
    productFactory = await ProductFactory.deploy(await proxy.getAddress());
    await productFactory.waitForDeployment();
  });

  it("should create a product", async function () {
    await expect(productFactory.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999))
      .to.emit(productFactory, "ProduitCree");

    const produit = await productFactory.produits(0);
    expect(produit.nom).to.equal("Pomme");
    expect(produit.exist).to.equal(true);
  });

  it("should not allow non-authorized user to add product", async function () {
    await expect(
      productFactory.connect(autre).addProduct("Poire", 5, "kg", "France", "Bio", 9999999999)
    ).to.be.revertedWith("Non autorise");
  });

  it("should mark product as for sale", async function () {
    await productFactory.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999);
    await expect(productFactory.mettreEnVente(0, ethers.parseEther("1")))
      .to.emit(productFactory, "ProduitMisEnVente");

    const produit = await productFactory.produits(0);
    expect(produit.enVente).to.be.true;
    expect(produit.prix).to.equal(ethers.parseEther("1"));
  });

  it("should not allow non-owner to put in sale", async function () {
    await productFactory.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999);
    await expect(productFactory.connect(user).mettreEnVente(0, 1000))
      .to.be.revertedWith("Pas proprietaire");
  });

  it("should delete a product", async function () {
    await productFactory.connect(user).addProduct("Jus", 1, "L", "France", "AB", 1234567890);
    await expect(productFactory.connect(user).deleteProd(0))
      .to.emit(productFactory, "ProduitSupprime");

    const produit = await productFactory.produits(0);
    expect(produit.exist).to.be.false;
  });

  it("should allow product to be bought", async function () {
    await productFactory.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999);
    await productFactory.mettreEnVente(0, ethers.parseEther("0.1"));

    await expect(productFactory.connect(user).acheterProduit(0, { value: ethers.parseEther("0.1") }))
      .to.emit(productFactory, "ProduitAchete");

    const produit = await productFactory.produits(0);
    expect(produit.proprietaire).to.equal(user.address);
    expect(produit.enVente).to.be.false;
  });

  it("should return only products on sale", async function () {
    await productFactory.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999);
    await productFactory.addProduct("Poire", 5, "kg", "France", "AB", 9999999999);
    await productFactory.mettreEnVente(0, 1000);

    const enVente = await productFactory.getProduitsEnVente();
    expect(enVente.length).to.equal(1);
    expect(enVente[0].nom).to.equal("Pomme");
  });
});
