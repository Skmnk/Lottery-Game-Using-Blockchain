const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");

const SUB_FUND_AMOUNT = ethers.parseEther("30");
const {verify} = require("../utils/verify");
module.exports = async function ({getNamedAccounts, deployments}){
    const{deploy, log} = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address, subscriptionId

    //VRFCoordinatorV2_5Mock
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
        // const vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deploy();
        // await vrfCoordinatorV2Mock.deployed();

        // console.log("vrf coordinator :", vrfCoordinatorV2Mock)
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.target

        // console.log("address of vrf :", vrfCoordinatorV2Address)

        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait();

        //console.log("logs comes here" ,transactionReceipt.logs[0].args.subId)
        subscriptionId = transactionReceipt.logs[0].args.subId
       
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, SUB_FUND_AMOUNT )
    }else{
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const enteranceFee = networkConfig[chainId]["enteranceFee"]
    const interval = networkConfig[chainId]["interval"]
    const args = [vrfCoordinatorV2Address,subscriptionId,enteranceFee,interval]
    const Raffel = await deploy("Raffel", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1
    })

    if(!developmentChains.includes(network.name)&& process.env.ETHERSCAN_KEY){
        console.log("verifying.....")
        await verify(Raffel.address,args)
    }
    log("````````````````````````````````````````````````````````````````")
}

module.exports.tags = ["all","Raffel"]
