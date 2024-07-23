// const { network } = require("hardhat");
const { ethers } = require("hardhat");
const {networkConfig, developmentChains} = require("../helper-hardhat-config")

const BASE_FEE = ethers.parseEther("0.25") // it cost premium = 0.25eth link for each transaction
const GAS_PRICE = ethers.parseEther("0.000001") 
const WEI_PER_UNIT_LINK = 1e9

module.exports = async function ({getNamedAccounts,deployments}){
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;
    const args = [BASE_FEE,GAS_PRICE,WEI_PER_UNIT_LINK]

    if(developmentChains.includes(network.name)){
        console.log("Local Network Detected ....!");
        /**deploy mocks with mock vrf coordinator */
        await deploy("VRFCoordinatorV2_5Mock",{
            from: deployer,
            args: args,
            log: true,
            gasLimit: 5000000,
        })
        log("Mocks deployed Successfully in local network");
        log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
    }
   
}

module.exports.tags = ["all","mocks"]