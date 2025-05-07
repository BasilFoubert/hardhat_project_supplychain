const { ethers, upgrades } = require("hardhat");

async function main() {
  const ImplV1 = await ethers.getContractFactory("ImplementationV1");
  const proxy = await upgrades.deployProxy(ImplV1, [], {
    initializer: "initialize",
  });

  await proxy.waitForDeployment();
  console.log("Proxy deployed at:", await proxy.getAddress());
}

main();