import { Alchemy, Network, } from 'alchemy-sdk';
import { useState, useEffect } from 'react';
import { Box, Container, Spinner, useToast } from "@chakra-ui/react"

import { Outlet, useNavigation, } from "react-router-dom";

import WithSubnavigation from './Navbar';
import InfoBar from "./InfoBar";
import { getBlockData, calculateBlockRewardByBlockReceipt } from './usefulScripts';

// Refer to the README doc for more information about using API
// keys in client-side code. You should never do this in production
// level code.
const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
const settings = {
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
};

// In this week's lessons we used ethers.js. Here we are using the
// Alchemy SDK is an umbrella library with several different packages.
//
// You can read more about the packages here:
//   https://docs.alchemy.com/reference/alchemy-sdk-api-surface-overview#api-surface
const alchemy = new Alchemy(settings);
function Root({ block, historicalLatestBlocks, setHistoricalLatestBlocks }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [errorMessage, setErrorMessage] = useState('');
    const toast = useToast();
    const navigation = useNavigation();

    useEffect(() => {
        //console.log("<Root /> mounted.")
        // Add an event listener to check for online/offline events
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));

        return () => {
            // Remove the event listeners when the component unmounts
            window.removeEventListener('online', () => setIsOnline(true));
            window.removeEventListener('offline', () => setIsOnline(false));
        };
    }, []);

    useEffect(() => {
        if (isOnline === false) {
            setErrorMessage('Error fetching data. Please check your internet connection.');
            toast({
                title: 'Network Error',
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }, [isOnline])
    useEffect(() => {
        (async () => {
            if (block.finalized !== null) {
                await getLatestSixBlocks();
            }
        })();

    }, [block.finalized, historicalLatestBlocks]);

    const getLatestSixBlocks = async () => {
        if (block.latest !== null && historicalLatestBlocks.length === 0) {
            let prevBlocks = [];
            let firstBlock = structuredClone(block.latest);

            // Calculate miner fees, and get the block receipt
            const data = await calculateBlockRewardByBlockReceipt(firstBlock);

            firstBlock = {
                ...firstBlock,
                blockReward: {
                    _hex: data.blockReward.toHexString(),
                    isBigNumber: data.blockReward._isBigNumber,
                },
                staticBlockReward: {
                    _hex: data.staticBlockReward.toHexString(),
                    isBigNumber: data.staticBlockReward._isBigNumber,
                },
                totalTxFees: {
                    _hex: data.totalTxFees.toHexString(),
                    isBigNumber: data.totalTxFees._isBigNumber,
                },
                burntFees: {
                    _hex: data.burntFees.toHexString(),
                    isBigNumber: data.burntFees._isBigNumber,
                },
                blockReceipt: data.blockReceipt,
            };
            prevBlocks.push(firstBlock);

            for (let i = 1; i < 6; i++) {
                let ithBlock = await getBlockData(firstBlock.number - i);
                // Calculate miner fees
                const data = await calculateBlockRewardByBlockReceipt(ithBlock);
                ithBlock = {
                    ...ithBlock,
                    blockReward: {
                        _hex: data.blockReward.toHexString(),
                        isBigNumber: data.blockReward._isBigNumber,
                    },
                    staticBlockReward: {
                        _hex: data.staticBlockReward.toHexString(),
                        isBigNumber: data.staticBlockReward._isBigNumber,
                    },
                    totalTxFees: {
                        _hex: data.totalTxFees.toHexString(),
                        isBigNumber: data.totalTxFees._isBigNumber,
                    },
                    burntFees: {
                        _hex: data.burntFees.toHexString(),
                        isBigNumber: data.burntFees._isBigNumber,
                    },
                    blockReceipt: data.blockReceipt,
                };

                prevBlocks.push(ithBlock);

                await new Promise((resolve) => setTimeout(resolve, 500)); // Delay before retrying
            }

            setHistoricalLatestBlocks(prevBlocks);
        }
    }
    const [searchValue, setSearchValue] = useState("");

    return (

        <Box>
            <InfoBar searchValue={searchValue} setSearchValue={setSearchValue} />
            <WithSubnavigation />
            <Container maxW="95%" >
                {navigation.state !== "loading" ?
                    <Outlet />
                    :
                    <Box maxW="95%" height="50vh" display="flex" justifyContent="center" alignItems="center" >
                        <Spinner
                            thickness='0.35em'
                            speed='1.25s'
                            emptyColor='gray.200'
                            color='blue.400'
                            boxSize="5em"
                        />
                    </Box>
                }
            </Container>
        </Box>

    );
}

export default Root;
