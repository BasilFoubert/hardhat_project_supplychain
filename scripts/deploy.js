const { ethers, upgrades } = require("hardhat");

async function main() {
  const ImplV1 = await ethers.getContractFactory("ImplementationV1");
  const proxy = await upgrades.deployProxy(ImplV1, [], {
    initializer: "initialize",
  });

  await proxy.waitForDeployment();
  console.log("Proxy deployed at:", await proxy.getAddress());

  //Déploiement module Actor
  const ActorM = await ethers.getContractFactory("Actor");
  const actorInstance = await ActorM.deploy(proxy.getAddress());
  await actorInstance.waitForDeployment();
  console.log("Contrat acteur deployed at: ", actorInstance.getAddress());

  //Déploiement module Product
  const ProductM = await ethers.getContractFactory("Product");
  const productInstance = await ProductM.deploy(proxy.getAddress());
  await productInstance.waitForDeployment();
  console.log("Contrat product deployed at: ", productInstance.getAddress());

  //Déploiement module Storage
  const StorageM = await ethers.getContractFactory("Storage");
  const storageInstance = await StorageM.deploy(proxy.getAddress(), productInstance.getAddress());
  await storageInstance.waitForDeployment();
  console.log("Contrat storage deployed at: ", storageInstance.getAddress());

  //Déploiement module Transformation
  const TransformationM = await ethers.getContractFactory("Transformation");
  const transfoInstance = await TransformationM.deploy(proxy.getAddress(), productInstance.getAddress(), storageInstance.getAddress());
  await transfoInstance.waitForDeployment();
  console.log("Contrat transformation deployed at: ", transfoInstance.getAddress());

  //Déploiement module Transport
  const TransportM = await ethers.getContractFactory("Transport");
  const TransportInstance = await TransportM.deploy();

}

main();