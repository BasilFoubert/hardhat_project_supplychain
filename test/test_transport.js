const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Transport", function () {
  let owner, transporteur, recepteur;
  let proxy, productContract, transportContract;

  beforeEach(async function () {
    [owner, transporteur, recepteur] = await ethers.getSigners();

    // Déploiement du proxy (ImplementationV1)
    const Impl = await ethers.getContractFactory("ImplementationV1");
    proxy = await upgrades.deployProxy(Impl, [], {
      initializer: "initialize",
      kind: "uups"
    });

    // Donne le rôle de transporteur
    const TRANSPORTEUR_ROLE = await proxy.TRANSPORTEUR_ROLE();
    await proxy.accorderRole(transporteur.address, TRANSPORTEUR_ROLE);

    // Déploiement de Product (mock minimal)
    const Product = await ethers.getContractFactory("ProductFactory");
    productContract = await Product.deploy(await proxy.getAddress());
    await productContract.waitForDeployment();

    // Création d’un produit + transfert au recepteur simulé
    await productContract.addProduct("Tomate", 5, "kg", "France", "AB", 9999999999);
    await productContract.mettreEnVente(0, ethers.parseEther("1"));
    await productContract.connect(recepteur).acheterProduit(0, {
      value: ethers.parseEther("1")
    });

    // Déploiement de Transport.sol
    const Transport = await ethers.getContractFactory("Transport");
    transportContract = await Transport.deploy(
      await proxy.getAddress(),
      await productContract.getAddress()
    );
  });

  it("devrait enregistrer un transport valide", async function () {
    await expect(
      transportContract.connect(transporteur).enregistrerTransport(
        owner.address,
        recepteur.address,
        [0],
        5,
        1234567890
      )
    ).to.emit(transportContract, "TransportEffectue");

    const nombre = await transportContract.getNombreTransports();
    expect(nombre).to.equal(1);
  });

  it("devrait refuser si le produit n'existe pas", async function () {
    await expect(
      transportContract.connect(transporteur).enregistrerTransport(
        owner.address,
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
      transportContract.connect(transporteur).enregistrerTransport(
        owner.address,
        owner.address,
        [0],
        0,
        1234567890
      )
    ).to.be.revertedWith("Le produit n'appartient pas au receveur");
  });

  it("devrait retourner les noms des produits transportés", async function () {
    await transportContract.connect(transporteur).enregistrerTransport(
      owner.address,
      recepteur.address,
      [0],
      3,
      1234567890
    );

    const noms = await transportContract.getNomProduitsTransportes(0);
    expect(noms.length).to.equal(1);
    expect(noms[0]).to.equal("Tomate");
  });
});
