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
    actor = await upgrades.deployProxy(ActorM, [await proxy.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  //Déploiement module Product
  const Product = await ethers.getContractFactory("ProductFactory");
    product = await upgrades.deployProxy(Product, [await proxy.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  //Déploiement module Storage
  const StorageM = await ethers.getContractFactory("StorageContract");
    storage = await upgrades.deployProxy(StorageM, [await proxy.getAddress(), await product.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  //Déploiement module Transformation
  const TransfoM = await ethers.getContractFactory("Transformation");
    transfo = await upgrades.deployProxy(TransfoM, [await proxy.getAddress(), await product.getAddress(), await storage.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  //Déploiement module Transport
  const TransportM = await ethers.getContractFactory("Transport");
    transport = await upgrades.deployProxy(TransportM, [await proxy.getAddress(), await product.getAddress()], {
    initializer: "initialize",
    kind: "uups",
  });

  const fs = require("fs");

  const addresses = {
    proxy: await proxy.getAddress(),
    actor: await actor.getAddress(),
    product: await product.getAddress(),
    storage: await storage.getAddress(),
    transfo: await transfo.getAddress(),
    transport: await transport.getAddress()
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to deployed-addresses.json");
}

main();