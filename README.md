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