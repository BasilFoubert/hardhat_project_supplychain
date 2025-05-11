# WRITING SMART CONTRACTS
https://hardhat.org/tutorial/writing-and-compiling-contracts
To compile the contract run npx hardhat compile in your terminal. The compile task is one of the built-in tasks.
npx hardhat compile

# TESTING
https://hardhat.org/tutorial/testing-contracts
npx hardhat test

# DEPLOY LOCALLY
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
# Supply Chain Smart Contracts (Hardhat + UUPS)

Ce projet est un système modulaire de gestion de la chaîne d'approvisionnement basé sur des smart contracts Ethereum. Il repose sur l'architecture upgradeable UUPS (Universal Upgradeable Proxy Standard) via la librairie OpenZeppelin.

## Fonctionnalités principales

- **Gestion des rôles** via `ImplementationV1` :
  - Producteur, Transformateur, Distributeur, Transporteur.
  - Attribution et demande de rôles dynamiques.
  
- **Module Acteur** :
  - Enregistrement et validation d’acteurs avec rôle et SIRET.
  
- **Module Produit (`ProductFactory`)** :
  - Création, mise en vente, suppression et achat de produits.

- **Module Stockage (`StorageContract`)** :
  - Gestion de stocks avec température et attribution de produits.

- **Module Transformation** :
  - Transformation de plusieurs produits en un autre, en respectant les permissions.

- **Module Transport** :
  - Enregistrement des livraisons de produits avec validation d'appartenance et température.

## Stack technique

- **Solidity** v0.8.28
- **Hardhat** avec plugins :
  - `@openzeppelin/hardhat-upgrades`
  - `@nomicfoundation/hardhat-toolbox`
- **Tests** : `chai`, `mocha` via `npx hardhat test`

## Tester les contrats

```bash
npx hardhat compile         # Compile les contrats
npx hardhat test            # Exécute les tests
```

## 🚀 Déploiement local

```bash
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

## Démo utilisateur (simulation réelle)

Pour tester l'utilisation réelle des contrats par un utilisateur externe après le déploiement :

1. **Lancer un réseau local** (dans un terminal) :
   ```bash
   npx hardhat node
   ```

2. **Déployer les contrats** (dans un second terminal) :
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   > Ce script déploie tous les contrats nécessaires et écrit leurs adresses dans `deployed-addresses.json`.

3. **Lancer un script de démo simulant un utilisateur** :
   ```bash
   npx hardhat run scripts/demo.js --network localhost
   ```

Dans ce scénario :
- L'administrateur déploie les contrats via `deploy.js`
- Tout utilisateur peut ensuite lire `deployed-addresses.json` pour interagir avec les contrats (par exemple pour créer des produits, acheter, transformer, etc.)

## Mise à jour (upgrade)

```bash
npx hardhat run scripts/upgrade.js --network localhost
```

## Structure

- `contracts/` : Tous les contrats (modulaires)
- `scripts/` : Déploiement et upgrade
- `test/` : Tests unitaires complets

