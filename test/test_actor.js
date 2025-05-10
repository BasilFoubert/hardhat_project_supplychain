const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ActeurContract", function () {
  let owner, user, autre;
  let proxy, acteurContract;

  beforeEach(async function () {
    [owner, user, autre] = await ethers.getSigners();

    // Déploiement du proxy d'ImplementationV1
    const ImplV1 = await ethers.getContractFactory("ImplementationV1");
    proxy = await upgrades.deployProxy(ImplV1, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await proxy.waitForDeployment();

    // Accorder des rôles
    await proxy.accorderRole(owner.address, await proxy.PRODUCTEUR_ROLE());
    await proxy.accorderRole(user.address, await proxy.TRANSFORMATEUR_ROLE());

    // Déploiement d'ActeurContract
    const ActeurContract = await ethers.getContractFactory("ActeurContract");
    acteurContract = await ActeurContract.deploy(await proxy.getAddress());
    await acteurContract.waitForDeployment();
  });

  it("devrait refuser un acteur sans rôle", async function () {
    await expect(
      acteurContract.connect(autre).enregistrerActeur("Nom", "Secteur", 123, "email@test.com")
    ).to.be.revertedWith("Acces refuse");
  });

  it("devrait enregistrer un acteur avec rôle valide", async function () {
    await expect(
      acteurContract.enregistrerActeur("Nom", "Agriculture", 123456789, "mail@exemple.com")
    ).to.not.be.reverted;

    const acteur = await acteurContract.acteurs(owner.address);
    expect(acteur.nom).to.equal("Nom");
    expect(acteur.actif).to.be.true;
    expect(acteur.numSiret).to.equal(123456789n);
  });

  it("devrait empêcher la double inscription", async function () {
    await acteurContract.enregistrerActeur("Nom", "Secteur", 111, "contact@test.com");

    await expect(
      acteurContract.enregistrerActeur("Nom2", "Autre", 222, "other@test.com")
    ).to.be.revertedWith("Acteur deja enregistre");
  });
});
