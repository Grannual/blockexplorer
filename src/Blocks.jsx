import { useState, useEffect } from 'react';
import {
    Box, Text, Heading, Divider, Button, Select,
    Card, CardBody,
    Link, Tooltip,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, TriangleDownIcon } from '@chakra-ui/icons';
import { Link as LinkRouter, } from "react-router-dom";
import { Utils } from 'alchemy-sdk';

import { formatNumber, getBlockData, getTimeAgo, useInterval, calculateBlockRewardByBlockReceipt, } from './usefulScripts';


async function loader({ request }) {



    return { request };
}

const Blocks = ({ block, historicalLatestBlocks, setHistoricalLatestBlocks }) => {
    const [paginationSettings, setPaginationSettings] = useState({
        pageQuantity: 1,
        curPage: 0,
        pageSize: 50,
    });

    useEffect(() => {
        // Configure pagination when txns for the address are fetched
        if (historicalLatestBlocks.length !== 0) {
            setPaginationSettings((prevPaginationSettings) => ({
                ...prevPaginationSettings,
                pageQuantity: Math.ceil((historicalLatestBlocks.length - 1) / parseInt(prevPaginationSettings.pageSize)),
            }));
        }

    }, [historicalLatestBlocks, paginationSettings.curPage, paginationSettings.pageSize]);

    const getNextBlock = async () => {
        let nextBlock = null;
        if (block.latest !== null && historicalLatestBlocks.length !== 0) {
            //console.log("block:", block, historicalLatestBlocks[0])
            //console.log("nextBlockNumber:", parseInt(historicalLatestBlocks[0].number, 16) + 1)
            nextBlock = await getBlockData(parseInt(historicalLatestBlocks[0].number, 16) + 1);

            // Calculate miner fees, and get the block receipt
            if (nextBlock === null) { return null }
            const data = await calculateBlockRewardByBlockReceipt(nextBlock);

            nextBlock = {
                ...nextBlock,
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
            return nextBlock;
        }
    }


    useInterval(async () => {
        if (historicalLatestBlocks.length >= 6) {
            const nextBlock = await getNextBlock();
            //console.log("nextBlock:", nextBlock);
            if (nextBlock !== null) {
                let isNewBlock = true;
                for (let i = 0; i < historicalLatestBlocks.length; i++) {
                    if (parseInt(historicalLatestBlocks[i].number, 16) === parseInt(nextBlock.number, 16)) {
                        isNewBlock = false;
                        break;
                    }
                }

                // Only append new block
                if (isNewBlock) {
                    setHistoricalLatestBlocks((prevBlocks) => ([nextBlock, ...prevBlocks]));
                }
            }
        }

    }, 5000)

    return (
        <Box >
            {historicalLatestBlocks.length !== 0 ? (
                <>
                    <Heading size='md' textAlign={"start"} m={3} mb={1} py={3}>
                        Blocks
                    </Heading>

                    <Divider m="3" my="5" />

                    <BlocksTable key={`page_${paginationSettings.curPage}`} historicalLatestBlocks={historicalLatestBlocks} paginationSettings={paginationSettings} setPaginationSettings={setPaginationSettings} />
                </>
            ) : null
            }
        </Box>
    );
};

const BlocksTable = ({ historicalLatestBlocks, paginationSettings, setPaginationSettings }) => {
    //console.log("pagination:", paginationSettings);
    const onNextPage = () => {
        if (parseInt(paginationSettings.curPage + 1) !== parseInt(paginationSettings.pageQuantity)) {
            setPaginationSettings((prevPaginationSettings) => ({
                ...prevPaginationSettings,
                curPage: prevPaginationSettings.curPage + 1,
            }));
        }
    }
    const onPreviousPage = () => {
        if (parseInt(paginationSettings.curPage) > 0) {
            setPaginationSettings((prevPaginationSettings) => ({
                ...prevPaginationSettings,
                curPage: prevPaginationSettings.curPage - 1,
            }));
        }
    }

    const pageSizeOption = [10, 25, 50, 100];
    const displayFromItem = paginationSettings.curPage * paginationSettings.pageSize;
    const displayToItem = (paginationSettings.curPage + 1) * paginationSettings.pageSize;

    return (
        <Card width={{ base: "100%" }} m={3} mt={5} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"}>

            <CardBody p={0}>
                <Text m="5" ml="4" mb="2" fontSize="sm" fontWeight="semibold">
                    {
                        `A total of recent ${historicalLatestBlocks.length !== 0 ? formatNumber(historicalLatestBlocks.length) : ""} block${historicalLatestBlocks.length !== 0 ? (historicalLatestBlocks.length > 1 ? "s" : "") : ""} are shown.`
                    }
                </Text>
                <TableContainer>
                    <Table variant='simple' size="sm">
                        <Thead >
                            <Tr mb={2} height="3em">
                                <Th maxW="75px" isNumeric>Block</Th>
                                <Th maxW="60px" >Age</Th>
                                <Th maxW="50px" isNumeric>Txn</Th>
                                <Th maxW="100px" isTruncated>Fee Receipient</Th>
                                <Th maxW="125px" isNumeric>Gas Used</Th>
                                <Th maxW="80px" isNumeric>Gas Limit</Th>
                                <Th maxW="60px" isNumeric>Base Fee</Th>
                                <Th maxW="75px" isNumeric>Reward</Th>
                                <Th maxW="100px" isNumeric>Burnt Fees (ETH)</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {
                                historicalLatestBlocks.length !== 0 && historicalLatestBlocks.slice(displayFromItem, displayToItem).map((block, index) => (
                                    <Tr key={`tr_${index}`} fontSize="sm" height="3.25em">
                                        <Td maxW="75px" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} isNumeric isTruncated>
                                            <Link as={LinkRouter} to={`/block/${block.number || null}`} color="blue.500" className="underline" style={{ textDecoration: "none" }}>
                                                {parseInt(block.number, 16) || null}
                                            </Link>
                                        </Td>

                                        <Td maxW="60px" fontSize="0.9em" >
                                            {getTimeAgo(block.timestamp)}
                                        </Td>

                                        <Td maxW="50px" isNumeric isTruncated>
                                            <Link as={LinkRouter} to={`/txs?block=${parseInt(block.number)}`} color="blue.500" className="underline" style={{ textDecoration: "none" }}>
                                                <span>{block.transactions.length}</span>
                                            </Link>
                                        </Td>


                                        <Td maxW="100px" isTruncated>
                                            <Box my={1} display="flex" flexDirection="row">
                                                <Link as={LinkRouter} className="underline" to={`/address/${block.miner}`} color={"blue.500"} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" >
                                                    <Tooltip hasArrow label={block.miner} placement='top' borderRadius={5} fontSize={13} noOfLines={1}>
                                                        <span style={{ fontSize: 14 }}>{block.miner}</span>
                                                    </Tooltip>
                                                </Link>
                                            </Box>
                                        </Td>


                                        <Td maxW="125px" height="1em" isNumeric isTruncated>
                                            <Box display="flex" justifyContent="flex-end" alignItems="center" letterSpacing="0.1px">
                                                <Text mr="1" fontSize="0.95em">
                                                    {formatNumber(parseInt(block.gasUsed))}
                                                </Text>
                                                <Box display="flex" justifyContent="center" alignItems="baseline">
                                                    <Box className='secondary-grey' fontSize="0.95em">
                                                        {`(${(parseInt(block.gasUsed) / parseInt(block.gasLimit) * 100).toFixed(2)}%  |`}
                                                    </Box>

                                                    {
                                                        parseFloat(parseInt(block.gasLimit) / 2 - parseInt(block.gasUsed)) > 0.00 ?
                                                            <Box style={{ color: "rgb(220,53,69)" }} fontSize="0.95em">
                                                                {`-${(50 - parseInt(block.gasUsed) / parseInt(block.gasLimit) * 100).toFixed(0)}%`}
                                                            </Box> :
                                                            <Box style={{ color: "rgb(0,161,134)" }} fontSize="0.95em">
                                                                {`+${(parseInt(block.gasUsed) / parseInt(block.gasLimit) * 100).toFixed(0)}%`}
                                                            </Box>
                                                    }
                                                    <Box>)</Box>
                                                </Box>
                                            </Box>
                                        </Td>

                                        <Td maxW="80px" isNumeric isTruncated>
                                            {formatNumber(parseInt(block.gasLimit))}
                                        </Td>

                                        <Td maxW="60px" isNumeric isTruncated>
                                            {`${parseFloat(Utils.formatUnits(block.baseFeePerGas, 9)).toFixed(2)} Gwei`}
                                        </Td>

                                        <Td maxW="75px" isNumeric>
                                            <Box display="flex" justifyContent="flex-end">
                                                <Box as="span" mr="2">{`${parseFloat(Utils.formatEther(block.blockReward._hex.toString())).toFixed(5)} `}</Box>
                                                <Box as="span">ETH</Box>
                                            </Box>
                                        </Td>

                                        <Td maxW="100px" isTruncated>
                                            {`${parseFloat(Utils.formatEther(block.burntFees._hex.toString())).toFixed(18)} ETH `}
                                        </Td>
                                    </Tr>
                                ))}
                        </Tbody>

                    </Table>
                </TableContainer>
            </CardBody>
            <Box display="flex" justifyContent="space-between" alignItems="center" m="3">
                <Box display="flex" justifyContent="space-around" alignItems="center">
                    <Text fontSize="sm" mx="3">Show:</Text>
                    <Select
                        size="sm" width="4.5em" borderRadius="6"
                        icon={<TriangleDownIcon fontSize="0.5em" />}
                        placeholder={paginationSettings.pageSize}
                        onChange={(e) => setPaginationSettings({ ...paginationSettings, pageSize: e.target.value })}
                    >
                        {
                            pageSizeOption.map((size) => (
                                parseInt(size) !== parseInt(paginationSettings.pageSize) ?
                                    <option key={size} value={size}>{size}</option> : null
                            ))
                        }

                    </Select>
                    <Text fontSize="sm" mx="3">Records</Text>
                </Box>
                <Box >
                    <Button
                        size="sm" fontSize="0.85em" fontWeight="light" px={2} py={1}
                        isDisabled={paginationSettings.curPage === 0}
                        onClick={
                            () => setPaginationSettings((prevPaginationSettings) => ({
                                ...prevPaginationSettings,
                                curPage: 0,
                            }))}
                    >
                        First
                    </Button>
                    <Button
                        size="sm" fontSize="0.85em" fontWeight="light" px={2} py={1} mx={1}
                        isDisabled={paginationSettings.curPage === 0}
                        onClick={onPreviousPage}
                    >
                        <ChevronLeftIcon ml={1} />
                    </Button>
                    <Button
                        size="sm" fontSize="0.85em" fontWeight="light" px={2} py={1}
                        isDisabled
                    >
                        Page of {paginationSettings.curPage + 1} of {paginationSettings.pageQuantity}
                    </Button>
                    <Button
                        size="sm" fontSize="0.85em" fontWeight="light" px={2} py={1} mx={1}
                        isDisabled={paginationSettings.curPage + 1 === paginationSettings.pageQuantity}
                        onClick={onNextPage}
                    >
                        <ChevronRightIcon ml={1} />
                    </Button>
                    <Button
                        size="sm" fontSize="0.85em" fontWeight="light" px={2} py={1}
                        isDisabled={paginationSettings.curPage + 1 === paginationSettings.pageQuantity}
                        onClick={
                            () => setPaginationSettings((prevPaginationSettings) => ({
                                ...prevPaginationSettings,
                                curPage: prevPaginationSettings.pageQuantity - 1,
                            }))}
                    >
                        Last
                    </Button>
                </Box>
            </Box>
        </Card >
    )
}


export { loader, Blocks as default };