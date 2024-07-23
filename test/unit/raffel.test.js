const { getNamedAccounts, deployments, ethers, network} = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const {assert,expect} = require("chai")


!developmentChains.includes(network.name) ? describe.skip 
: describe("Raffel Unit Test", async function(){
    let Raffel , vrfCoordinatorV2_5Mock, raffelEnteranceFee,deployer,interval
    const chainId = network.config.chainId;

    beforeEach(async () =>{
        // const { deployer } = await getNamedAccounts()
        // await deployments.fixture["all"]

        deployer  = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        Raffel = await ethers.getContract("Raffel", deployer)
        vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock", deployer)
        raffelEnteranceFee = await Raffel.getEnteranceFee();
        interval = await Raffel.getInterval()


    })

    describe("constructor", async function(){
        it("Initialize the raffel correctly", async function(){
            const raffelState = await Raffel.getRaffelState()
            assert.equal(raffelState.toString(), "0" )
            assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        }) 
    })

    describe("enterRaffel", async function(){
        it("it reverts when you dont pay enough", async function(){
            await expect(Raffel.enterRaffel()).to.be.revertedWithCustomError(
                Raffel,
                "Raffel__notEnoughEthEntered"
            );
        })

        it("records player when the enter", async function(){
            await Raffel.enterRaffel({
                value: raffelEnteranceFee
            })
            const playerFromContract = await Raffel.getPlayers(0);
            assert.equal(playerFromContract, deployer)
        })

        it("Emits events on enter", async function(){
            await expect(Raffel.enterRaffel({value: raffelEnteranceFee})).to.emit(
                Raffel,
                "raffelEnter"
            )
        })

        // it("dose not allows users while calculating", async function(){
        //     await Raffel.enterRaffel({
        //         value: raffelEnteranceFee
        //     })
        //     await network.provider.send("evm_increaseTime", [Number(interval) +1 ])
        //     await network.provider.send("evm_mine",[])
        //     await network.provider.request({
        //         method: "evm_mine",
        //         params: []
        //     })

        //     const [upkeepNeeded, performData] = await Raffel.checkUpkeep.staticCall("0x");
        //     console.log("Upkeep needed:", upkeepNeeded);

        //     // await Raffel.performUpkeep("0x");
        //     if (upkeepNeeded) {
        //         await Raffel.performUpkeep(performData);
        //     }

        //     await expect(Raffel.enterRaffel({value:raffelEnteranceFee})).to.be.revertedWithCustomError(
        //         Raffel,
        //         "Raffel__upKeepNotNeeded"
        //     )
        // })
    })
    describe("checkUpkeep", async function(){
        it("returns false if people haven't sent any ETH", async () => {
            await network.provider.send("evm_increaseTime", [Number(interval) + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await Raffel.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(!upkeepNeeded)
        })

        it("returns false if Raffel isn't open", async () => {
            await Raffel.enterRaffel({ value: raffelEnteranceFee })
            await network.provider.send("evm_increaseTime", [Number(interval) + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            await Raffel.performUpkeep("0x") // changes the state to calculating
            const raffelState = await Raffel.getRaffelState() // stores the new state
            const { upkeepNeeded } = await Raffel.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert.equal(raffelState.toString() == "1", upkeepNeeded == false)
        })

        it("returns false if enough time hasn't passed", async () => {
            await Raffel.enterRaffel({ value: raffelEnteranceFee })
            await network.provider.send("evm_increaseTime", [Number(interval) - 5]) // use a higher number here if this test fails
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await Raffel.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(!upkeepNeeded)
        })

        it("returns true if enough time has passed, has players, eth, and is open", async () => {
            await Raffel.enterRaffel({ value: raffelEnteranceFee })
            await network.provider.send("evm_increaseTime", [Number(interval) + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await Raffel.checkUpkeep.staticCall("0x")
                  assert(upkeepNeeded)
        })
    })


})
   