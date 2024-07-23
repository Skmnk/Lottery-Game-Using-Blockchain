/**  1. to join the lottery (with some amount)
 *   2. pick the winner randomly - (verifiably random)
 *   3. winner to be selected for every x minutes (automated)

 *    chainlink oracle (Randomness and chainlink Keeper)
*/

// SPDX-License-Intifier: MIT
pragma solidity ^0.8.19;

//vrf
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
//keeper
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
//errors
error Raffel__notEnoughEthEntered();
error Raffel__TransferFailed();
error Raffel__NotOpen();
error Raffel__upKeepNotNeeded(uint256 balance, uint256 numberOfPlayers, uint256 raffelstate);

// inherit vrfconsumerbasev2plus from chainlink
contract Raffel is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
    // type declaration
    enum RaffelState {
        open,
        calculating
    }
    // state variables

    uint256 private immutable i_enteranceFee;
    address payable[] private s_players;
    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        uint256[] randomWords;
    }
    mapping(uint256 => RequestStatus) public s_requests;

    uint256[] public requestIds;
    uint256 public lastRequestId;
    bytes32 public keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 2;
    uint256 private immutable i_subscriptionId;
    IVRFCoordinatorV2Plus private immutable i_vrfCoordinator;

    /////lottery variable
    address private s_recentWinner;
    RaffelState private s_raffelState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    //events
    event raffelEnter(address indexed player);
    event winnerRandomRequest(uint256 requestId);
    event winnerPicked(address indexed winner);

    /**
     * HARDCODED FOR SEPOLIA
     * COORDINATOR: 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
     */
    //constructor
    constructor(
        address vrfCoordinatorV2Address,
        uint256 subscriptionId,
        uint256 enteranceFee,
        uint256 interval
    ) VRFConsumerBaseV2Plus(vrfCoordinatorV2Address) {
        i_vrfCoordinator = IVRFCoordinatorV2Plus(vrfCoordinatorV2Address);
        i_subscriptionId = subscriptionId;
        i_enteranceFee = enteranceFee;
        s_raffelState = RaffelState.open;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    /*functions */

    function enterRaffel() public payable {
        if (msg.value < i_enteranceFee) {
            revert Raffel__notEnoughEthEntered();
        }
        if (s_raffelState != RaffelState.open) {
            revert Raffel__NotOpen();
        }
        s_players.push(payable(msg.sender));

        emit raffelEnter(msg.sender);
    }

    /**
     * @dev
     *  check upkeep for the function  to return upkeepNeeded  true
     *  time interval should be passed
     *  atleast 1 player
     *  subscription funded with link
     *  lottery should be open
     */

    function checkUpkeep(
        bytes memory /* checkdata */
    ) public override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool isOpen = (s_raffelState == RaffelState.open);
        bool isTimePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);

        upkeepNeeded = (isOpen && isTimePassed && hasPlayers && hasBalance);
        return (upkeepNeeded, "0x0");
    }

    function performUpkeep(bytes calldata /* checkdata*/) public override {
        /** performupkeep function with this */
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffel__upKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffelState)
            );
        }
    }

    function requestRandomWinner(bool enableNativePayment) external returns (uint256 requestId) {
        s_raffelState = RaffelState.calculating;
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: i_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: enableNativePayment})
                )
            })
        );
        s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        requestIds.push(requestId);
        lastRequestId = requestId;
        emit winnerRandomRequest(requestId);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 /*requestId */,
        uint256[] calldata randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffelState = RaffelState.open;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;

        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffel__TransferFailed();
        }
        emit winnerPicked(recentWinner);
    }

    /** view / pure functions */

    function getEnteranceFee() public view returns (uint256) {
        return i_enteranceFee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffelState() public view returns (RaffelState) {
        return s_raffelState;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
