const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Transport", function () {
  let producteur, transporteur, recepteur, owner;
  let proxy, product, transport;

  beforeEach(async function () {
  [producteur, transporteur, recepteur, owner] = await ethers.getSigners();

  // Déploiement du proxy (ImplementationV1)
  const Impl = await ethers.getContractFactory("ImplementationV1");
  proxy = await upgrades.deployProxy(Impl.connect(owner), [], {
    initializer: "initialize",
    kind: "uups"
  });

  // Récupération des rôles
  const TRANSPORTEUR_ROLE = await proxy.TRANSPORTEUR_ROLE();
  const PRODUCTEUR_ROLE = await proxy.PRODUCTEUR_ROLE();
  const DISTRIBUTEUR_ROLE = await proxy.DISTRIBUTEUR_ROLE();

  // Attribution des rôles
  await proxy.accorderRole(transporteur.address, TRANSPORTEUR_ROLE);
  await proxy.accorderRole(producteur.address, PRODUCTEUR_ROLE);
  await proxy.accorderRole(recepteur.address, DISTRIBUTEUR_ROLE);

  // Déploiement de ProductFactory
  const Product = await ethers.getContractFactory("ProductFactory");
    product = await upgrades.deployProxy(Product.connect(owner), [await proxy.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });
  await product.waitForDeployment();

  // Création du produit par le producteur (producteur)
  await product.connect(producteur).addProduct("Tomate", 5, "kg", "France", "AB", 9999999999);
  await product.connect(producteur).mettreEnVente(0, ethers.parseEther("1"));

  // Achat du produit par le recepteur
  await product.connect(recepteur).acheterProduit(0, {
    value: ethers.parseEther("1")
  });

  // Déploiement de Transport.sol
  const TransportM = await ethers.getContractFactory("Transport");
    transport = await upgrades.deployProxy(TransportM.connect(owner), [await proxy.getAddress(), await product.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });
  await transport.waitForDeployment();
});


  it("devrait enregistrer un transport valide", async function () {
    await expect(
      transport.connect(transporteur).enregistrerTransport(
        producteur.address,
        recepteur.address,
        [0],
        5,
        1234567890
      )
    ).to.emit(transport, "TransportEffectue");

    const nombre = await transport.getNombreTransports();
    expect(nombre).to.equal(1);
  });

  it("devrait refuser si le produit n'existe pas", async function () {
    await expect(
      transport.connect(transporteur).enregistrerTransport(
        producteur.address,
        recepteur.address,
        [999], // produit inexistant
        0,
        1234567890
      )
    ).to.be.revertedWith("Produit inexistant");
  });

  it("devrait refuser si le produit n'appartient pas au receveur", async function () {
    // produit acheté par recepteur, on simule un mauvais receveur
    await expect(
      transport.connect(transporteur).enregistrerTransport(
        producteur.address,
        producteur.address,
        [0],
        0,
        1234567890
      )
    ).to.be.revertedWith("Le produit n'appartient pas au receveur");
  });

  it("devrait retourner les noms des produits transportés", async function () {
    await transport.connect(transporteur).enregistrerTransport(
      producteur.address,
      recepteur.address,
      [0],
      3,
      1234567890
    );

    const noms = await transport.getNomProduitsTransportes(0);
    expect(noms.length).to.equal(1);
    expect(noms[0]).to.equal("Tomate");
  });
});
