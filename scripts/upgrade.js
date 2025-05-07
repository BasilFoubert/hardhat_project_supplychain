const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "ADRESSE_DU_PROXY_DEPLOYE"; // à remplacer

  const ImplV2 = await ethers.getContractFactory("ImplementationV2");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, ImplV2);

  console.log("Contract upgraded. New address (same proxy):", await upgraded.getAddress());
}

main();