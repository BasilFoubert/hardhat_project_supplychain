const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("UUPS Upgradeable Test", function () {
  it("should upgrade successfully", async function () {
    const ImplV1 = await ethers.getContractFactory("ImplementationV1");
    const proxy = await upgrades.deployProxy(ImplV1, [], { initializer: "initialize" });

    expect(await proxy.getValue()).to.equal(1);
    await proxy.setValue(42);
    expect(await proxy.getValue()).to.equal(42);

    const ImplV2 = await ethers.getContractFactory("ImplementationV2");
    const upgraded = await upgrades.upgradeProxy(await proxy.getAddress(), ImplV2);

    expect(await upgraded.version()).to.equal("V2");
  });
});


