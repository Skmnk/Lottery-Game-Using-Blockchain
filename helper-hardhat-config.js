const { ethers } = require("hardhat");

const networkConfig ={
    11155111: {
        name : "sepolia",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        enteranceFee: ethers.parseEther("0.01"),
        subscriptionId: "16223544189755463263588270794972577161801008605145878815491107555709237374478",
        interval: "15"
    },
    31337: {
        name: "localhost",
        enteranceFee:  ethers.parseEther("0.01"),
        interval: "15"
        // Mock price feed address will be set during deployment
    }
}

const developmentChains = ["hardhat", "localhost"];



module.exports = {
    networkConfig,
    developmentChains


}