require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true // ← active le compilateur en "IR" (Intermediate Representation)
    }
  }
};


