const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("ImplementationV1 (UUPS)", function () {
  let ImplementationV1, proxy, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    ImplementationV1 = await ethers.getContractFactory("ImplementationV1");
      proxy = await upgrades.deployProxy(ImplementationV1.connect(owner), [], {
      initializer: "initialize",
      kind: "uups",
    });

    await proxy.waitForDeployment();
  });

  it("devrait initialiser correctement avec l'owner", async function () {
    expect(await proxy.owner()).to.equal(owner.address);
  });

  it("devrait avoir le role DEFAULT_ADMIN_ROLE", async function () {
    const DEFAULT_ADMIN_ROLE = await proxy.DEFAULT_ADMIN_ROLE();
    expect(await proxy.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
  });

  it("ne devrait pas autoriser un non-owner à setValue", async function () {
    await expect(proxy.connect(user).setValue(99)).to.be.reverted;
  });

  it("devrait émettre un event quand on demande un rôle", async function () {
    const role = await proxy.PRODUCTEUR_ROLE();
    const siret = ethers.keccak256(ethers.toUtf8Bytes("12345678900012"));

    await expect(proxy.connect(user).demanderRole(role, siret))
      .to.emit(proxy, "RoleDemande")
      .withArgs(user.address, role, siret);
  });

  it("devrait permettre à l'admin d'accorder un rôle", async function () {
    const role = await proxy.PRODUCTEUR_ROLE();

    await proxy.accorderRole(user.address, role);
    expect(await proxy.hasRole(role, user.address)).to.be.true;
  });

  it("ne devrait pas permettre à un non-admin d'accorder un rôle", async function () {
    const role = await proxy.PRODUCTEUR_ROLE();
    await expect(proxy.connect(user).accorderRole(owner.address, role)).to.be.reverted;
  });
});
