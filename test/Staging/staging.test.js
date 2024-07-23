const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffel Staging Tests", function () {
          let Raffel, RaffelEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              Raffel = await ethers.getContract("Raffel", deployer)
              RaffelEntranceFee = await Raffel.getEnteranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  // enter the Raffel
                  console.log("Setting up test...")
                  const startingTimeStamp = await Raffel.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      // setup listener before we enter the Raffel
                      // Just in case the blockchain moves REALLY fast
                      Raffel.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our asserts here
                              const recentWinner = await Raffel.getRecentWinner()
                              const RaffelState = await Raffel.getRaffelState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await Raffel.getLatestTimeStamp()

                              await expect(Raffel.getPlayers(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(RaffelState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(RaffelEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // Then entering the Raffel
                      console.log("Entering Raffel...")
                      const tx = await Raffel.enterRaffel({ value: RaffelEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()

                      // and this code WONT complete until our listener has finished listening!
                  })
              })
          })
      })