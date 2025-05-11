const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ActeurContract", function () {
  let owner, user, autre;
  let proxy, actor;

  beforeEach(async function () {
    [owner, user, autre] = await ethers.getSigners();
    // Déploiement du proxy d'ImplementationV1
    const ImplV1 = await ethers.getContractFactory("ImplementationV1");
    proxy = await upgrades.deployProxy(ImplV1.connect(owner), [], {
      initializer: "initialize",
      kind: "uups"
    });
    await proxy.waitForDeployment();
    // Accorder des rôles
    await proxy.accorderRole(user.address, await proxy.PRODUCTEUR_ROLE());
   
    // Déploiement d'ActeurContract
    const ActorM = await ethers.getContractFactory("ActeurContract");
    
    const proxyAddress = await proxy.getAddress();
    actor = await upgrades.deployProxy(ActorM.connect(owner), [proxyAddress], {
      initializer: "initialize",
      kind: "uups",
    });
    await actor.waitForDeployment();
  });

  it("devrait refuser un acteur sans rôle", async function () {
    await expect(
      actor.connect(autre).enregistrerActeur("Nom", "Secteur", 123, "email@test.com")
    ).to.be.revertedWith("Acces refuse");
  });

  it("devrait enregistrer un acteur avec rôle valide", async function () {
    await expect(
      actor.connect(user).enregistrerActeur("Nom", "Agriculture", 123456789, "mail@exemple.com")
    ).to.not.be.reverted;

    const acteur = await actor.acteurs(user.address);
    expect(acteur.nom).to.equal("Nom");
    expect(acteur.actif).to.be.true;
    expect(acteur.numSiret).to.equal(123456789n);
  });

  it("devrait empêcher la double inscription", async function () {
    await actor.connect(user).enregistrerActeur("Nom", "Secteur", 111, "contact@test.com");

    await expect(
      actor.connect(user).enregistrerActeur("Nom2", "Autre", 222, "other@test.com")
    ).to.be.revertedWith("Acteur deja enregistre");
  });
});
