
//require("@nomiclabs/hardhat-waffle")
require("@nomicfoundation/hardhat-toolbox");

// require("@nomiclabs/hardhat-etherscan")
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-ethers");


require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()




const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  //solidity: "^0.8.19",
  defaultNetwork: "hardhat",
  networks:{
    hardhat:{
      chainId: 31337,
      blockConfirmations: 1,
      blockGasLimit: 5000000
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      chainId: 11155111,
      blockConfirmations:  6
    },
  },
  solidity:{
    compilers:[
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ]
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
},
mocha: {
  timeout: 300000
},
etherscan: {
  // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
  apiKey: {
      sepolia: process.env.ETHERSCAN_KEY,
      
  }
},
};
