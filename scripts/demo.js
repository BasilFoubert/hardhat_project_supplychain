//Pour tester le script de démo
//Lance la blockchain local
//npx hardhat node

//Déploie notre application
//npx hardhat run scripts/deploy.js --network localhost

//Lance le script de démo
//npx hardhat run scripts/demo.js --network localhost

const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin, producteur, acheteur] = await ethers.getSigners();

  const deployedAddresses = JSON.parse(
    fs.readFileSync("deployed-addresses.json", "utf8")
  );

  const ImplV1 = await ethers.getContractFactory("ImplementationV1");
  const proxy = ImplV1.attach(deployedAddresses.proxy);

  const Product = await ethers.getContractFactory("ProductFactory");
  const productContract = Product.attach(deployedAddresses.product);

    // 2. Attribuer les rôles nécessaires
    await proxy.accorderRole(producteur.address, await proxy.PRODUCTEUR_ROLE());
    await proxy.accorderRole(acheteur.address, await proxy.DISTRIBUTEUR_ROLE());

    // 4. Producteur crée un produit
    await productContract.connect(producteur).addProduct(
        "Fraises", 20, "kg", "France", "Bio", Math.floor(Date.now() / 1000) + 100000
    );
    console.log("Produit créé par producteur");

    // 5. Mise en vente
    await productContract.connect(producteur).mettreEnVente(0, ethers.parseEther("0.5"));
    console.log("Produit mis en vente");

    // 6. Achat par le distributeur
    await productContract.connect(acheteur).acheterProduit(0, {
        value: ethers.parseEther("0.5"),
    });
    console.log("Produit acheté par le distributeur");

    // 7. Vérification
    const produit = await productContract.produits(0);
    console.log("Nouveau propriétaire du produit:", produit.proprietaire);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});