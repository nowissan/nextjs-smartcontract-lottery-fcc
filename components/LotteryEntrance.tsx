import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { BigNumber, ethers, ContractTransaction } from "ethers"
import { useNotification } from "web3uikit"

interface contractAddressInterface {
    [key: string]: string[]
}

export default function LotteryEntrance() {
    const addresses: contractAddressInterface = contractAddresses
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex!).toString()
    const raffleAddress = chainId in addresses ? addresses[chainId][0] : null
    // console.log(parseInt(chainIdHex))

    // let entranceFee = ""
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

    const dispatch = useNotification()

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress!,
        functionName: "getRecentWinner",
        params: {},
    })

    async function updateUI() {
        const entranceFeeFromCall = ((await getEntranceFee()) as BigNumber).toString()
        const numPlayersFromCall = ((await getNumberOfPlayers()) as BigNumber).toString()
        const recentWinnerFromCall = (await getRecentWinner()) as string
        setEntranceFee(entranceFeeFromCall)
        setNumPlayers(numPlayersFromCall)
        setRecentWinner(recentWinnerFromCall)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const handleSuccess = async function (txn: ContractTransaction) {
        await txn.wait(1)
        handleNewNotification()
        updateUI()
    }

    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Txn Notifiction",
            position: "topR",
        })
    }

    // async function listenEvent() {
    //     // if (typeof window.ethereum !== "undefined") { ...
    //     const provider = new ethers.providers.Web3Provider(window.ethereum)
    //     const signer = provider.getSigner()
    //     const raffle = new ethers.Contract(raffleAddress, abi, signer)
    //     raffle.on("WinnerPicked", (from, to, value, event) => {
    //         let transferEvent = {
    //             from: from,
    //             to: to,
    //             value: value,
    //             eventData: event,
    //         }
    //         console.log(JSON.stringify(transferEvent, null, 4))
    //         updateUI()
    //     })
    // }

    // useEffect(() => {
    //     listenEvent()
    // }, [])

    return (
        <div>
            Hi from lottery entrance!
            {raffleAddress ? (
                <div className="p-5">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async function () {
                            await enterRaffle({
                                onSuccess: (txn) => handleSuccess(txn as ContractTransaction),
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>
                    <div>Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH</div>
                    <div>Number of Players: {numPlayers}</div>
                    <div>Recent Winner: {recentWinner}</div>
                </div>
            ) : (
                <div>No Raffle Address Detected</div>
            )}
        </div>
    )
}
