import axios from 'axios';
import {
    useColorModeValue,
} from "@chakra-ui/react";
import React from 'react';
const { Utils, Alchemy, BigNumber, Network, } = require("alchemy-sdk");

const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
const settings = {
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

const ethereumStaticBlockRewardTable = [
    {
        block: 0,
        value: Utils.parseEther("5"),
    },
    {
        block: 4370000,
        value: Utils.parseEther("3"),
    },
    {
        block: 7280000,
        value: Utils.parseEther("2"),
    },
    {
        block: 15537393,
        value: 0,
    }
]
const Colors = () => {
    return ({
        mainTextColor: useColorModeValue('black.500'),
        secondaryTextColor: useColorModeValue('gray.500', 'gray.300'),
        redTextColor: useColorModeValue('red.500', 'red.500'),
        greenTextColor: useColorModeValue('green.500', 'green.500'),
        backgroundColorGray50: useColorModeValue('gray.100', 'gray.500'),
        backgroundColorBlue500: useColorModeValue('blue.500', 'blue.500'),
        backgroundColorGreen: useColorModeValue('green.100', 'green.600'),
        backgroundColorGreen500: useColorModeValue('green.500'),
        backgroundColorRed: useColorModeValue('red.100', 'red.400'),
        backgroundColorOrange50: useColorModeValue('orange.100', 'yellow.500'),
        urlColorBlue: useColorModeValue("blue.400", "blue.400"),
    })
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function insertLineBreaks(hexString, lineLength) {
    const regex = new RegExp(`.{1,${lineLength}}`, 'g');
    return hexString.match(regex).join('\n');
}

function getTimeAgo(timestamp) {
    const currentTime = Date.now();
    const timeDifference = currentTime - timestamp * 1000;

    // Calculate seconds, minutes, and hours
    const secondsAgo = Math.floor(timeDifference / 1000);
    const minutesAgo = Math.floor(secondsAgo / 60);
    const hoursAgo = Math.floor(minutesAgo / 60);
    const daysAgo = Math.floor(hoursAgo / 24);
    const monthsAgo = Math.floor(daysAgo / 30.5);
    const yearsAgo = Math.floor(monthsAgo / 12);

    // Determine the appropriate unit (seconds, minutes, or hours)
    if (secondsAgo < 60) {
        return `${secondsAgo} sec${secondsAgo > 1 ? 's' : ''} ago`;
    } else if (minutesAgo < 60) {
        return `${minutesAgo} min${minutesAgo > 1 ? 's' : ''} ago`;
    } else if (hoursAgo < 24) {
        return `${hoursAgo} hr${hoursAgo > 1 ? 's' : ''} ${minutesAgo % 60} min${minutesAgo > 1 ? 's' : ''} ago`;
    } else if (daysAgo < 30.5) {
        return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ${hoursAgo % 24} hr${hoursAgo > 1 ? 's' : ''} ago`;
    } else if (monthsAgo < 12) {
        return `${monthsAgo} month${monthsAgo > 1 ? 's' : ''} ${Math.floor(daysAgo % 30.5) > 0 ? (`${Math.floor(daysAgo % 30.5)} day${daysAgo > 1 ? 's' : ''}`) : ""} ago`;
    } else if (yearsAgo < 12) {
        return `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ${monthsAgo % 12} month${monthsAgo > 1 ? 's' : ''} ago`;
    }
}

async function getFeeData(maxRetries = 5) {
    let retries = 0, feeData = null;
    while (retries < maxRetries) {
        const delayDuration = delayMs(2 ** retries);

        try {
            feeData = await alchemy.core.getFeeData();
            if (feeData !== null) { break }
            retries++;
        } catch (err) {
            console.warn(`Error fetching block: ${err}`);
            retries++;
        }

        await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
    }
    return feeData;
}

// Custom interval hook
function useInterval(callback, delay) {
    const savedCallback = React.useRef();

    React.useEffect(() => {
        savedCallback.current = callback;
    });

    React.useEffect(() => {
        function tick() {
            savedCallback.current();
        }

        let id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}

const calculateTxFee_BurntFee_txSavings = (txData, txReceipt, txBlock, txn_type = 2) => {
    // All units are in WEI
    //console.log("here123", txData, txData.gasPrice);
    // tx Fee
    const gasUsed = BigNumber.from(txReceipt.gasUsed._hex);
    const gasPrice = BigNumber.from(txData.gasPrice);
    const txFee = gasPrice.mul(gasUsed);

    // tx Savings
    let txSavings = null;
    if (txn_type === 2) {
        const maxFeePerGas = BigNumber.from(txData.maxFeePerGas);
        const gasPriceDiff = maxFeePerGas.sub(gasPrice);
        txSavings = gasPriceDiff.mul(gasUsed);
    }

    // tx burnt fee
    const baseGasPrice = BigNumber.from(txBlock.baseFeePerGas);
    const burntFee = baseGasPrice.mul(gasUsed);
    //console.log([txFee, burntFee, txSavings]);
    return [txFee, burntFee, txSavings];
}

async function getLatestBlock() {
    return ({
        finalized: await getBlockData("", "finalized"),
        safe: await getBlockData("", "safe"),
        latest: await getBlockData("", "latest"),
    });
}

const delayMs = (mult) => mult * getRndInteger(1250, 1500);

const getTransactionReceiptByHash = async (txHash, maxRetries = 5) => {
    let retries = 0, response = null;

    while (retries < maxRetries) {
        const delayDuration = delayMs(2 ** retries);

        try {
            response = await alchemy.core.getTransactionReceipt(txHash);
            break;
        } catch (error) {
            console.error(`Error fetching transaction: ${error}`);
            retries++;

            await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
        }
    }

    // to inspect the response data
    //console.log(response);

    // return the JSONRPC response of txs
    return response;
}

const getTransactionByHash = async (txHash, maxRetries = 5) => {
    let retries = 0, response = null;

    while (retries < maxRetries) {
        const delayDuration = delayMs(2 ** retries);

        try {
            response = await axios.post(url, {
                jsonrpc: "2.0",
                id: 0,
                method: "eth_getTransactionByHash",
                params: [txHash],
            });

            if (response.status === 200) {
                // Check if the response contains "error" properties
                const hasErrors = response.data.hasOwnProperty("error");

                if (hasErrors) {
                    console.warn('One or more requests encountered errors:', response.data);
                    // Handle the error as needed
                    // You can implement a retry strategy or skip the batch, depending on your requirements
                    retries++;
                    await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
                } else {
                    break; // Break the retry loop on success
                }
            } else {
                console.warn(`Error fetching transactions (HTTP status ${response.status}):`, response.statusText);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            }

        } catch (error) {
            console.warn(`Error fetching transaction: ${error}`);
            retries++;
            await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
        }
    }

    // to inspect the response data
    //console.log(response);

    // return the JSONRPC response of txs
    return response.data.result;
}

async function getBlockData(blockNumber, blockTag = "", maxRetries = 5) {
    //number is not hex from transactionView
    let retries = 0, block = null;
    if (typeof blockNumber === "number") {
        while (retries < maxRetries) {
            const delayDuration = delayMs(2 ** retries);

            try {
                //block = await alchemy.core.getBlock(blockNumber);
                const response = await axios.post(url, {
                    jsonrpc: "2.0",
                    id: 0,
                    method: "eth_getBlockByNumber",
                    params: [
                        Utils.hexStripZeros(Utils.hexlify(blockNumber)),
                        false
                    ]
                })
                block = response.data.result;
                if (response.status === 200) { break }
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            } catch (err) {
                console.warn(`Error fetching block: ${err}`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            }
        }
    } else if (blockTag !== "") {
        while (retries < maxRetries) {
            const delayDuration = delayMs(2 ** retries);

            try {
                const response = await axios.post(url, {
                    jsonrpc: "2.0",
                    id: 0,
                    method: "eth_getBlockByNumber",
                    params: [
                        blockTag,
                        false
                    ]
                })
                block = response.data.result;
                if (response.status === 200) { break }
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            } catch (err) {
                console.warn(`Error fetching block: ${err}`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            }
        }
    }
    //console.log("to return block", block);
    return block;
}

/* --------- Block Method Specific for App and BlockView --------- */

const calculateBurntFees = (Block) => {
    // Convert baseFeePerGas and gasUsed to BigNumber
    let baseFeePerGasWei = BigNumber.from(Block.baseFeePerGas);
    let gasUsedWei = BigNumber.from(Block.gasUsed);

    //console.log(baseFeePerGasWei, gasUsedWei);
    // Multiply baseFeePerGas by gasUsed
    const burntFeesWei = baseFeePerGasWei.mul(gasUsedWei);

    return burntFeesWei;
}

async function getBlockReceipt(blockNumber, maxRetries = 10) {
    let retries = 0, JSONRPCresponse = null, dataToPost = {
        jsonrpc: "2.0",
        id: 0,
        method: "eth_getBlockReceipts",
        params: [Utils.hexStripZeros(blockNumber)],
    };
    //console.log("dataToPost:", dataToPost);
    while (retries < maxRetries) {
        const delayDuration = delayMs(2 ** retries);
        try {
            JSONRPCresponse = await axios.post(url, dataToPost);

            if (JSONRPCresponse.status === 200) {
                // Check if the response contains "error" properties
                const hasErrors = JSONRPCresponse.data.hasOwnProperty("error");

                if (hasErrors) {
                    console.warn('One or more requests encountered errors:', JSONRPCresponse.data);
                    // Handle the error as needed
                    // You can implement a retry strategy or skip the batch, depending on your requirements
                    retries++;
                    await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
                } else {
                    break; // Break the retry loop on success
                }
            } else {
                console.warn(`Error fetching block receipt (HTTP status ${JSONRPCresponse.status}):`, JSONRPCresponse.statusText);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            }
        } catch (error) {
            console.warn(`Error fetching block receipt with block num.: ${blockNumber}, ${JSON.stringify(dataToPost)} - ${error}`);
            retries++;
            await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
        }

    }

    // to inspect the response data
    //console.log(JSONRPCresponse);

    // return the JSONRPC response of txs
    if (JSONRPCresponse === null) { return null }
    return JSONRPCresponse.data;
}

const getTransactionFeesAndBlockReceipt = async (block) => {
    //const startTime = Date.now();
    //console.log('block here:', block);
    let txFeesWei = BigNumber.from(0);
    // Get the block's transactions
    const receipt = await getBlockReceipt(block.number);
    if (receipt === null) {
        return {
            txFees: txFeesWei,
            blockReceipt: [],
        };
    } else if (receipt.result.length === 0) {
        return {
            txFees: txFeesWei,
            blockReceipt: [],
        };
    }
    const promises = receipt.result.map(async (tx, index) => {
        // Convert gasLimit and gasPrice to BigNumber
        const gasUsedWei = BigNumber.from(tx.gasUsed);
        const effectiveGasPriceWei = BigNumber.from(tx.effectiveGasPrice);
        const txFeeWei = gasUsedWei.mul(effectiveGasPriceWei);

        // Update the tx's fee
        receipt.result[index]["txFee"] = {
            _hex: txFeeWei.toHexString(),
            isBigNumber: txFeeWei._isBigNumber,
        };

        //console.info("txHash:", tx.transactionHash, tx, "fees:", Utils.formatEther(txFeeWei.toString()))
        txFeesWei = txFeesWei.add(txFeeWei);
    });

    await Promise.all(promises);

    //const endTime = Date.now();
    //const executionTime = endTime - startTime;

    //console.log(`Total Tx Fees by blockReceipt execution time: ${executionTime} ms`);

    return {
        txFees: txFeesWei,
        blockReceipt: receipt.result,
    };
}

const calculateBlockRewardByBlockReceipt = async (block) => {
    let burntFees = 0, staticBlockReward = BigNumber.from(0);

    // Determine the static block reward
    for (let i = 0; i < ethereumStaticBlockRewardTable.length; i++) {
        if (parseInt(block.number, 16) < parseInt(ethereumStaticBlockRewardTable[i].block)) {
            staticBlockReward = BigNumber.from(ethereumStaticBlockRewardTable[i - 1].value);
            break;
        }
    }

    const data = await getTransactionFeesAndBlockReceipt(block);

    // Implementation of EIP-1559 starts from block 12965000
    if (parseInt(block.number, 16) >= 12965000) {
        burntFees = calculateBurntFees(block);
    }

    let blockReward = data.txFees.sub(burntFees);

    blockReward = blockReward.add(staticBlockReward);

    if (blockReward < 0) {
        return BigNumber.from(0);
    }

    return {
        blockReward: blockReward,
        staticBlockReward: staticBlockReward,
        totalTxFees: data.txFees,
        burntFees: burntFees,
        blockReceipt: data.blockReceipt,
    };
}


const getTokensForOwner = async (addressHash, maxRetries = 5) => {
    let retries = 0, tokenMeta = null;

    if (typeof addressHash === "string") {

        while (retries < maxRetries) {
            const delayDuration = delayMs(2 ** retries);

            try {
                tokenMeta = await alchemy.core.getTokensForOwner(addressHash);
                const hasErrors = tokenMeta.tokens.some(item => item.name === undefined);

                if (hasErrors) {
                    console.warn('One or more requests encountered errors:', tokenMeta);
                    // Handle the error as needed
                    // You can implement a retry strategy or skip the batch, depending on your requirements
                    retries++;
                    await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
                } else {
                    if (tokenMeta !== null) { break } // Break the retry loop on success
                }
            } catch (err) {
                console.warn(`Error fetching tokens for owner: ${err} : addressHash: ${addressHash}`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            }
        }
        if (tokenMeta !== null) {
            // Filter out 0 balances token
            tokenMeta.tokens = tokenMeta.tokens.filter((item, index) => {
                if (parseFloat(item.rawBalance) > 0.0) { return item }
            });

        }
    }

    //Logging the response to the console
    //console.log("token:", tokenMeta);

    // The response returns the tokens the address owns and relevant metadata.
    return tokenMeta;
};

async function getTransactionsByAddress(addressHash, sendToPageKey = null, sendFromPageKey = null, maxRetries = 5) {
    let retries = 0, txSendFromAddress = null, txSendToAddress = null, response = null, firstTxSent = null, lastTxSent = null;

    if (typeof addressHash === "string" && addressHash.length <= 42) {

        while (retries < maxRetries) {
            const delayDuration = delayMs(2 ** retries);

            try {
                if (sendFromPageKey !== null) {
                    txSendFromAddress = await alchemy.core.getAssetTransfers({
                        fromBlock: "0x0",
                        fromAddress: addressHash,
                        excludeZeroValue: true,
                        withMetadata: true,
                        order: "desc",
                        category: ["external", "internal", "erc20", "erc721", "erc1155", "specialnft"],
                        pageKey: sendFromPageKey,
                    });
                } else {
                    txSendFromAddress = await alchemy.core.getAssetTransfers({
                        fromBlock: "0x0",
                        fromAddress: addressHash,
                        excludeZeroValue: true,
                        withMetadata: true,
                        order: "desc",
                        category: ["external", "internal", "erc20", "erc721", "erc1155", "specialnft"],
                    });
                }

                //console.log("txSendFromAddress:", txSendFromAddress);
                if (sendToPageKey !== null) {
                    txSendToAddress = await alchemy.core.getAssetTransfers({
                        fromBlock: "0x0",
                        toAddress: addressHash,
                        excludeZeroValue: true,
                        withMetadata: true,
                        order: "desc",
                        category: ["external", "internal", "erc20", "erc721", "erc1155", "specialnft"],
                        pageKey: sendToPageKey,
                    });
                } else {
                    txSendToAddress = await alchemy.core.getAssetTransfers({
                        fromBlock: "0x0",
                        toAddress: addressHash,
                        excludeZeroValue: true,
                        withMetadata: true,
                        order: "desc",
                        category: ["external", "internal", "erc20", "erc721", "erc1155", "specialnft"],
                    });
                }


                // Determine the first and last transfer tx signed the address
                if (txSendFromAddress !== null && txSendToAddress !== null) {
                    const externalTxns = txSendFromAddress.transfers.filter(tx => tx.category === "external");
                    //console.log("external", externalTxns, txSendFromAddress, txSendToAddress);
                    lastTxSent = externalTxns[0];
                    firstTxSent = externalTxns[externalTxns.length - 1];
                    //console.log("first:", externalTxns, firstTxSent, lastTxSent);

                    response = {
                        transfers: (txSendFromAddress.transfers.concat(txSendToAddress.transfers)).sort((a, b) => {
                            const blockNumberA = parseInt(a.blockNum, 16);
                            const blockNumberB = parseInt(b.blockNum, 16);

                            return blockNumberB - blockNumberA; // Sort in descending order
                        }),
                        sendToPageKey: "pageKey" in txSendToAddress ? txSendToAddress.pageKey : null,
                        sendFromPageKey: "pageKey" in txSendFromAddress ? txSendFromAddress.pageKey : null,
                    }

                    // Break the retry loop on success
                    break;
                } else {
                    retries++;
                    await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
                }

            } catch (err) {
                console.warn(`Error fetching txns by address: ${err}, ${addressHash}`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            }
        }

    }

    //console.log("transfer:", response);
    return [response, firstTxSent, lastTxSent];
}

const getAddressBalance = async (addressHash, maxRetries = 5) => {
    let retries = 0, response = null;

    if (typeof addressHash === "string") {

        while (retries < maxRetries) {
            const delayDuration = delayMs(2 ** retries);

            try {
                // This response fetches the balance of the given address in the paramter as of the provided block.
                response = await alchemy.core.getBalance(addressHash, "latest");
                if (response !== null) { break } // Break the retry loop on success

            } catch (err) {
                console.warn(`Error fetching block: ${err}`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
            }
        }
    }

    //Logging the response to the console
    //console.log(response);

    // The response returns the tokens the address owns and relevant metadata.
    return response;
};


async function getAllTransactions({ pageKey = null, blockNum = null, maxRetries = 5 }) {
    let retries = 0, response = null, params = {
        excludeZeroValue: true,
        withMetadata: true,
        order: "desc",
        category: ["external", "internal", "erc20", "erc721", "erc1155", "specialnft"],
        maxCount: Utils.hexlify(500),
    };

    while (retries < maxRetries) {
        const delayDuration = delayMs(2 ** retries);

        try {
            if (pageKey !== null) {
                if (blockNum !== null) {
                    params = {
                        ...params,
                        fromBlock: blockNum,
                        toBlock: blockNum,
                        pageKey: pageKey,
                    };
                } else {
                    params = {
                        ...params,
                        pageKey: pageKey,
                    };
                }

            } else if (blockNum !== null) {
                //console.log("query by block:", blockNum);
                params = {
                    ...params,
                    fromBlock: blockNum,
                    toBlock: blockNum,
                };

            }

            response = await alchemy.core.getAssetTransfers(params);

            // Determine the first and last transfer tx signed the address
            if (response !== null) {
                // Break the retry loop on success
                break;
            }

        } catch (err) {
            console.warn(`Error fetching all txns: ${JSON.stringify(params)} `);
            retries++;
            await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
        }
    }

    //console.log("all txs fetched:", response);
    return response;
}

export { Colors, ethereumStaticBlockRewardTable, delayMs, getRndInteger, formatNumber, insertLineBreaks, getTimeAgo, getFeeData, useInterval, calculateBlockRewardByBlockReceipt, calculateTxFee_BurntFee_txSavings, getLatestBlock, getTransactionByHash, getTransactionReceiptByHash, getBlockData, getTokensForOwner, getTransactionsByAddress, getAddressBalance, getAllTransactions };