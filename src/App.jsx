import './App.css';
import { useEffect, useState } from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import Root from './Root';
import Home from './Home';
import ErrorPage from "./ErrorPage";
import BlockView, { loader as blockLoader, } from './BlockView';
import Blocks, { loader as blocksLoader, } from './Blocks';
import TransactionView, { loader as transactionLoader, } from './TransactionView';
import AddressView, { loader as addressLoader, } from './AddressView';
import TxnsFilter from './TxnsFilter';
import { getLatestBlock, } from './usefulScripts';


function App() {

    const [block, setBlock] = useState({
        finalized: null,
        safe: null,
        latest: null,
    });
    const [historicalLatestBlocks, setHistoricalLatestBlocks] = useState([]);

    useEffect(() => {
        (async () => {
            setBlock(await getLatestBlock());
        })();
    }, []);

    useEffect(() => {
        //console.log("historicalLatestBlocks:", historicalLatestBlocks);
    }, [historicalLatestBlocks]);

    const router = createBrowserRouter([
        {
            path: "/",
            element: <Root block={block} historicalLatestBlocks={historicalLatestBlocks} setHistoricalLatestBlocks={setHistoricalLatestBlocks} />,
            errorElement: <ErrorPage />,
            children: [
                {
                    errorElement: <ErrorPage />,
                    children: [
                        {
                            index: true,
                            element: <Home historicalLatestBlocks={historicalLatestBlocks} />
                        },
                        {
                            path: "/block/:blockNo",
                            element: <BlockView block={block} />,
                            loader: blockLoader,
                        },
                        {
                            path: "/blocks",
                            element: <Blocks block={block} historicalLatestBlocks={historicalLatestBlocks} setHistoricalLatestBlocks={setHistoricalLatestBlocks} />,
                            loader: blocksLoader,
                        },
                        {
                            path: "/tx/:txHash",
                            element: <TransactionView block={block} />,
                            loader: transactionLoader,
                        },
                        {
                            path: "/txs",
                            element: <TxnsFilter />,
                        },
                        {
                            path: "/address/:addressHash",
                            element: <AddressView />,
                            loader: addressLoader,
                        },
                    ],
                }
            ],
        },
    ]);

    /*async function fetchTransactionWithBatchRequest(txHashes, maxRetries = 5) {
        let batchSize = txHashes.length < 25 ? txHashes.length : 50, batch = [], response = [];

        txHashes.forEach((txHash, index) => {
            batch.push({
                jsonrpc: "2.0",
                id: index,
                method: "eth_getTransactionReceipt",
                params: [txHash],
            });
        })

        //console.log("batches:", batch);
        for (let i = 0; i < batch.length; i += batchSize) {
            const length = parseInt(i + batchSize) > batch.length ? batch.length : parseInt(i + batchSize);
            const batchToPost = batch.slice(i, length);
            //console.log("batch to post:", batchToPost);

            let retries = 0;

            while (retries < maxRetries) {
                const delayDuration = delayMs(retries);
                try {
                    const JSONRPCresponse = await axios.post(url, batchToPost);

                    if (JSONRPCresponse.status === 200) {
                        // Check if the response contains "error" properties
                        const hasErrors = JSONRPCresponse.data.some(item => item.error);

                        if (hasErrors) {
                            console.error('One or more requests encountered errors:', JSONRPCresponse.data);
                            // Handle the error as needed
                            // You can implement a retry strategy or skip the batch, depending on your requirements
                            retries++;
                            await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
                        } else {
                            response = response.concat(JSONRPCresponse.data);
                            break; // Break the retry loop on success
                        }
                    } else {
                        console.error(`Error fetching transactions (HTTP status ${JSONRPCresponse.status}):`, JSONRPCresponse.statusText);
                        retries++;
                        await new Promise((resolve) => setTimeout(resolve, delayDuration)); // Delay before retrying
                    }
                } catch (error) {
                    console.error(`Error fetching transaction: ${error}`);
                    throw error;
                }

            }
        };

        // to inspect the response data
        //console.log(response);

        // return the JSONRPC response of txs
        return response;
    }*/
    /*const getTransactionFees = async (block) => {
        const startTime = Date.now();

        let txFeesWei = BigNumber.from(0);
        // Get the block's transactions
        const txs = await fetchTransactionWithBatchRequest(block.transactions);

        const promises = txs.map(async (tx_JSONRPC, index) => {
            // Convert gasLimit and gasPrice to BigNumber

            const gasUsedWei = BigNumber.from(tx_JSONRPC.result.gasUsed);
            const effectiveGasPriceWei = BigNumber.from(tx_JSONRPC.result.effectiveGasPrice);
            const txFeeWei = gasUsedWei.mul(effectiveGasPriceWei);
            //console.info("txHash:", tx_JSONRPC.result.transactionHash, tx_JSONRPC, "fees:", Utils.formatEther(txFeeWei.toString()))
            txFeesWei = txFeesWei.add(txFeeWei);

        });

        await Promise.all(promises);

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        console.log(`Execution time: ${executionTime} ms`);

        return txFeesWei;
    }*/
    /*const calculateBlockReward = async (block) => {
        const txFees = await getTransactionFees(block);
        const burntFees = calculateBurntFees(block);
        //console.log("BlockNum:", block.number, "txFees:", Utils.formatEther(txFees.toString()), "burntFees:", Utils.formatEther(burntFees.toString()), "Reward:", Utils.formatEther(txFees.sub(burntFees).toString()));
        const blockReward = txFees.sub(burntFees)
        if (blockReward < 0) {
            return BigNumber.from(0);
        }
        return {
            blockReward: blockReward,
            totalTxFees: txFees,
            burntFees: burntFees,
        };
    }*/

    return (
        <RouterProvider router={router} />
    )
}

export default App;