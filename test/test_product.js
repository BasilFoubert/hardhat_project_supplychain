const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ProductFactory", function () {
  let owner, user, autre;
  let proxy, product;

  beforeEach(async function () {
    [owner, user, autre] = await ethers.getSigners();

    // Déploiement du proxy avec ImplementationV1
    const ImplV1 = await ethers.getContractFactory("ImplementationV1");
      proxy = await upgrades.deployProxy(ImplV1.connect(owner), [], {
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
    const Product = await ethers.getContractFactory("ProductFactory");
      product = await upgrades.deployProxy(Product.connect(owner), [await proxy.getAddress()], {
      initializer: "initialize",
      kind: "uups",
    });
    await product.waitForDeployment();
  });

  it("should create a product", async function () {
    await expect(product.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999))
      .to.emit(product, "ProduitCree");

    const produit = await product.produits(0);
    expect(produit.nom).to.equal("Pomme");
    expect(produit.exist).to.equal(true);
  });

  it("should not allow non-authorized user to add product", async function () {
    await expect(
      product.connect(autre).addProduct("Poire", 5, "kg", "France", "Bio", 9999999999)
    ).to.be.revertedWith("Non autorise");
  });

  it("should mark product as for sale", async function () {
    await product.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999);
    await expect(product.mettreEnVente(0, ethers.parseEther("1")))
      .to.emit(product, "ProduitMisEnVente");

    const produit = await product.produits(0);
    expect(produit.enVente).to.be.true;
    expect(produit.prix).to.equal(ethers.parseEther("1"));
  });

  it("should not allow non-owner to put in sale", async function () {
    await product.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999);
    await expect(product.connect(user).mettreEnVente(0, 1000))
      .to.be.revertedWith("Pas proprietaire");
  });

  it("should delete a product", async function () {
    await product.connect(user).addProduct("Jus", 1, "L", "France", "AB", 1234567890);
    await expect(product.connect(user).deleteProd(0))
      .to.emit(product, "ProduitSupprime");

    const produit = await product.produits(0);
    expect(produit.exist).to.be.false;
  });

  it("should allow product to be bought", async function () {
    await product.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999);
    await product.mettreEnVente(0, ethers.parseEther("0.1"));

    await expect(product.connect(user).acheterProduit(0, { value: ethers.parseEther("0.1") }))
      .to.emit(product, "ProduitAchete");

    const produit = await product.produits(0);
    expect(produit.proprietaire).to.equal(user.address);
    expect(produit.enVente).to.be.false;
  });

  it("should return only products on sale", async function () {
    await product.addProduct("Pomme", 10, "kg", "France", "Bio", 9999999999);
    await product.addProduct("Poire", 5, "kg", "France", "AB", 9999999999);
    await product.mettreEnVente(0, 1000);

    const enVente = await product.getProduitsEnVente();
    expect(enVente.length).to.equal(1);
    expect(enVente[0].nom).to.equal("Pomme");
  });
});
