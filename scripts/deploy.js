const { ethers, upgrades } = require("hardhat");

async function main() {
  const ImplV1 = await ethers.getContractFactory("ImplementationV1");
  const proxy = await upgrades.deployProxy(ImplV1, [], {
    initializer: "initialize",
  });

  await proxy.waitForDeployment();
  console.log("Proxy deployed at:", await proxy.getAddress());

  //Déploiement module Actor
  const ActorM = await ethers.getContractFactory("ProductFactory");
    actor = await upgrades.deployProxy(ActorM, [proxy.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  //Déploiement module Product
  const Product = await ethers.getContractFactory("ProductFactory");
    product = await upgrades.deployProxy(Product, [proxy.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  //Déploiement module Storage
  const StorageM = await ethers.getContractFactory("StorageContract");
    storage = await upgrades.deployProxy(StorageM, [proxy.getAddress(), product.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  //Déploiement module Transformation
  const TransfoM = await ethers.getContractFactory("Transformation");
    transfo = await upgrades.deployProxy(TransfoM, [proxy.getAddress(), product.getAddress(), storage.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  //Déploiement module Transport
  const TransportM = await ethers.getContractFactory("Transport");
    transport = await upgrades.deployProxy(TransportM, [proxy.getAddress(), product.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });
}

main();