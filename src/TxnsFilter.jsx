import { useState, useEffect } from 'react';
import {
    Box, Text, Heading, Divider, Button, Select,
    Card, CardBody,
    Link,
    Tag, TagLabel,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner,
} from "@chakra-ui/react";
import { ArrowForwardIcon, ChevronLeftIcon, ChevronRightIcon, TriangleDownIcon, SmallAddIcon } from '@chakra-ui/icons';
import {
    redirect,
    Link as LinkRouter,
    useNavigate,
    useLocation,
} from "react-router-dom";
import { Utils } from 'alchemy-sdk';
import { Colors, formatNumber, getTimeAgo, getTransactionsByAddress, getAllTransactions } from './usefulScripts';

const TxnsFilter = () => {
    const navigate = useNavigate();
    let location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const addressHash = searchParams.get('a') || null;
    const blockNum = searchParams.get('block') || null;

    var filterBy = "none";

    const [addressTxns, setAddressTxns] = useState({
        full: [],
        external: [],
        internal: [],
        erc20: [],
        erc721: [],
        erc1155: [],
        specialnft: [],
        toDisplay: [],
        pageKey: null,
        sendToPageKey: null,
        sendFromPageKey: null,
        uniqueId: null,
    });
    const [isFetching, setIsFetching] = useState(false);
    const [paginationSettings, setPaginationSettings] = useState({
        pageQuantity: 1,
        curPage: 0,
        pageSize: 50,
    });

    useEffect(() => {
        // Disable additional fetching
        setIsFetching((prevState) => true);

        let response = null, params = {};
        (async () => {
            if (addressHash !== null) {
                // Filter by address
                filterBy = "address";
                const [txns, _, __] = await getTransactionsByAddress(addressHash);
                response = txns;

            } else {
                if (blockNum !== null) {
                    filterBy = "block";
                    try {
                        const regex = /^[0-9]+$/;
                        if (!regex.test(blockNum)) {
                            return redirect(`/error?error=invalidBlockNumber:${blockNum}`);
                        }
                        params["blockNum"] = Utils.hexlify(parseInt(blockNum));
                    } catch (err) {
                        return redirect(`/error?err=${err}`);
                    }
                }

                // Get all txns either by block number or without it
                const firstAllTxnsResponseObj = await getAllTransactions(params);

                if (firstAllTxnsResponseObj !== null) {
                    response = firstAllTxnsResponseObj;
                }
            }
            //console.log("TxnsFilter LOADER:", filterBy, response, "pageKey in response?:", response === null ? "not found" : "pageKey" in response);

            // Error handling
            if (filterBy === "address") {
                if (addressHash === null) {
                    return navigate("/error?error=Invalid Address Query");
                } else if (response === null || response === undefined) {
                    return navigate(`/error?error=Failed to fetch transactions details for address=${addressHash}.`);
                }
            } else if (filterBy === "block") {
                const regex = /^[0-9]+$/;

                if (blockNum === null || !regex.test(blockNum)) {
                    return redirect(`/error?error=invalidBlockNumber:${blockNum}`);
                } else if (response === null || response === undefined) {
                    return navigate(`/error?error=Failed to fetch transactions details for block=${blockNum}.`);
                }
            } else if (response === null || response === undefined) {
                return navigate("/error?error=Failed to fetch transactions details.");
            };

            const processedTxns = postProcessTxns(response.transfers);
            processedTxns.pageKey = "pageKey" in response ? response.pageKey : null;
            processedTxns.sendToPageKey = "sendToPageKey" in response ? response.sendToPageKey : null;
            processedTxns.sendFromPageKey = "sendFromPageKey" in response ? response.sendFromPageKey : null;

            setAddressTxns(processedTxns);
        })();

        setIsFetching((prevState) => false);
    }, [])

    useEffect(() => {
        // Configure pagination when txns for the address are fetched and when pageSize changed
        if (addressTxns.full !== null && addressTxns.toDisplay !== null) {
            setPaginationSettings((prevPaginationSettings) => ({
                ...prevPaginationSettings,
                pageQuantity: Math.ceil((addressTxns.toDisplay.length - 1) / parseInt(prevPaginationSettings.pageSize)),
            }));
        }

    }, [addressTxns, paginationSettings.pageSize]);

    const fetchTxns = async () => {
        setIsFetching((prevState) => true);

        if (filterBy === "address") {
            let pageKeys = [addressTxns.sendToPageKey, addressTxns.sendFromPageKey], tempTxns = [], params = {};

            /*while (true) {
                await new Promise((resolve) => setTimeout(resolve, 1250)); // Delay before the next 1000 txns fetch
                //console.info("txns length:", allTxns, allTxns.length);

                const intermediaryAllTxnsResponseObj = await getAllTransactions({ ...params, pageKey: pageKey });
                if (tempTxns.length >= 500) {
                    break;
                } else if (!("pageKey" in intermediaryAllTxnsResponseObj)) {
                    tempTxns = tempTxns.concat(intermediaryAllTxnsResponseObj.transfers);
                    pageKey = intermediaryAllTxnsResponseObj.pageKey;
                    break;
                }

                // Continue to fetch
                tempTxns = tempTxns.concat(intermediaryAllTxnsResponseObj.transfers);
                pageKey = intermediaryAllTxnsResponseObj.pageKey;
            }*/
            const intermediaryAllTxnsResponseObj = await getTransactionsByAddress(addressHash, pageKeys[0], pageKeys[1]);
            tempTxns = tempTxns.concat(intermediaryAllTxnsResponseObj.transfers);
            pageKeys = [intermediaryAllTxnsResponseObj.sendToPageKey, intermediaryAllTxnsResponseObj.sendFromPageKey];

            const processedTxns = postProcessTxns(tempTxns);
            processedTxns.sendToPageKey = pageKeys[0];
            processedTxns.sendToPageKey = pageKeys[1];

            setAddressTxns(processedTxns);
        } else {
            if (addressTxns.pageKey !== null) {
                let pageKey = addressTxns.pageKey, tempTxns = [], params = {};

                const intermediaryAllTxnsResponseObj = await getAllTransactions({ ...params, pageKey: pageKey });
                tempTxns = tempTxns.concat(intermediaryAllTxnsResponseObj.transfers);
                pageKey = intermediaryAllTxnsResponseObj.pageKey;

                const processedTxns = postProcessTxns(tempTxns);
                processedTxns.pageKey = pageKey;
                setAddressTxns(processedTxns);
            }
        }

        setIsFetching((prevState) => false);
    }

    const postProcessTxns = (txns) => {
        let addresses = { ...addressTxns }, uniqueId = {
            external: {},
            internal: {},
            erc20: {},
            erc721: {},
            erc1155: {},
            specialnft: {},
        };

        // Determine unique txns
        uniqueId = txns.reduce((result, tx) => {
            const [hash, data, number] = tx.uniqueId.split(":");
            if (!result[tx.category][hash] || parseInt(number) < parseInt(result[tx.category][hash].number)) {
                result[tx.category][hash] = {
                    uniqueId: tx.uniqueId,
                    number: number,
                };
            }
            return result;
        }, uniqueId);

        addresses = {
            ...addresses,
            full: addresses.full.concat(txns),
            external: txns !== null ? addresses.external.concat(txns.filter(tx => tx.category === "external")) : addresses.external,
            // Post-process erc20 txns for uniqueId, since token1 -> weth involves the smart contract internal transactions, i.e. 2 or more txns.            
            internal: txns !== null ? addresses.internal.concat(txns.filter(tx => {
                if (tx.category === "internal") {
                    // UniqueId format: hash/internal/No
                    const [id, data, numbering] = tx.uniqueId.split(":");
                    if (numbering === "0") {
                        // Assuming the first tx initiated has the total value
                        return tx;
                    }
                }
            })) : addresses.internal,
            erc20: txns !== null ? addresses.erc20.concat(txns.filter(tx => {
                if (tx.category === "erc20") {
                    // UniqueId format: hash/log/No
                    const [hash, data, number] = tx.uniqueId.split(":");
                    if (uniqueId.erc20[hash] && uniqueId.erc20[hash].uniqueId === tx.uniqueId) {
                        return tx;
                    }
                }
            })) : addresses.erc20,
            erc721: txns !== null ? addresses.erc721.concat(txns.filter(tx => {
                if (tx.category === "erc721") {
                    // UniqueId format: hash/log/No
                    const [hash, data, number] = tx.uniqueId.split(":");
                    if (uniqueId.erc721[hash] && uniqueId.erc721[hash].uniqueId === tx.uniqueId) {
                        return tx;
                    }
                }

            })) : addresses.erc721,
            erc1155: txns !== null ? addresses.erc1155.concat(txns.filter(tx => {
                if (tx.category === "erc1155") {
                    // UniqueId format: hash/log/No
                    const [hash, data, number] = tx.uniqueId.split(":");
                    if (uniqueId.erc1155[hash] && uniqueId.erc1155[hash].uniqueId === tx.uniqueId) {
                        return tx;
                    }
                }
            })) : addresses.erc1155,
            specialnft: txns !== null ? addresses.specialnft.concat(txns.filter(tx => {
                if (tx.category === "specialnft") {
                    // UniqueId format: hash/log/No
                    const [hash, data, number] = tx.uniqueId.split(":");
                    if (uniqueId.specialnft[hash] && uniqueId.specialnft[hash].uniqueId === tx.uniqueId) {
                        return tx;
                    }
                }
            })) : addresses.specialnft,
        };

        const sortedTxnsAddress = addresses.external.concat(addresses.internal).concat(addresses.erc20).concat(addresses.erc721).concat(addresses.erc1155).concat(addresses.specialnft).sort((a, b) => {
            const txDateA = new Date(a.metadata.blockTimestamp).valueOf();
            const txDateB = new Date(b.metadata.blockTimestamp).valueOf();

            return txDateB - txDateA; // Sort in descending order
        });
        addresses.toDisplay = sortedTxnsAddress;
        return addresses;
    }


    return (

        <Box >

            {
                addressTxns.full.length !== 0 ? (
                    <>
                        <Box display="flex" alignItems="baseline" justifyContent="space-between">
                            <Heading size='md' textAlign={"start"} m={3} mb={1} py={3}>
                                Transactions
                            </Heading>
                            <Button
                                isLoading={isFetching}
                                loadingText='Fetching'
                                isDisabled={(filterBy != "address" && addressTxns.pageKey === null) || (filterBy === "address" && addressTxns.sendFromPageKey === null && addressTxns.sendToPageKey === null) ? true : false}
                                leftIcon={<SmallAddIcon />}
                                colorScheme="teal"
                                size="sm"
                                variant="outline"
                                onClick={fetchTxns}
                            >
                                Fetch for more
                            </Button>
                        </Box>
                        {
                            filterBy === "address" ?
                                <Text ml="3" mb={5} fontSize="sm">
                                    For
                                    <Link as={LinkRouter} to={`/address/${addressHash}`} color="blue.500" className="underline" style={{ textDecoration: "none" }}>
                                        {addressHash}
                                    </Link>
                                </Text>
                                :
                                (
                                    filterBy === "block" ?
                                        <Text ml="3" mb={3}>
                                            For Block
                                            <Link as={LinkRouter} to={`/block/${blockNum}`} color="blue.500" className="underline" style={{ textDecoration: "none" }}>
                                                {` ${blockNum}`}
                                            </Link>
                                        </Text> : null
                                )
                        }
                        <Divider m="3" my="5" />


                        <TxnsTable key={`page_${paginationSettings.curPage}`} filterBy={filterBy} addressHash={addressHash} addressTxns={addressTxns.toDisplay} internalTxns={addressTxns.internal} paginationSettings={paginationSettings} setPaginationSettings={setPaginationSettings} />
                    </>
                )
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

        </Box>

    );
};

const TxnsTable = ({ filterBy, addressHash, addressTxns, internalTxns, paginationSettings, setPaginationSettings }) => {
    const colors = Colors();

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
                    {filterBy === "address" || filterBy === "block" ?
                        `A total of  ${addressTxns.length !== 0 ? formatNumber(addressTxns.length) : ""} transaction${addressTxns !== null ? (addressTxns.length > 1 ? "s" : "") : ""} found of which ${internalTxns !== null ? internalTxns.length : 0} are Internal${internalTxns !== null ? (internalTxns.length > 1 ? "s" : "") : ""}.`
                        :
                        `A total of ${addressTxns.length !== 0 ? formatNumber(addressTxns.length) : ""} recent transaction${addressTxns !== null ? (addressTxns.length > 1 ? "s" : "") : ""} are shown.`
                    }
                </Text>
                <TableContainer>
                    <Table variant='simple' size="sm">
                        <Thead >
                            <Tr mb={2} height="3em">
                                <Th maxW="125px" isTruncated>Transaction Hash</Th>
                                <Th maxW="80px" isNumeric isTruncated>Block</Th>
                                <Th maxW="100px">Age</Th>
                                <Th maxW="75px"></Th>
                                <Th maxW="100px">From</Th>
                                <Th maxW="50px"></Th>
                                <Th maxW="100px">To</Th>
                                <Th maxW="100px" isNumeric>Value</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {
                                addressTxns !== null && addressTxns.slice(displayFromItem, displayToItem).map((tx, index) => (
                                    <Tr key={`tr_${index}`} fontSize="sm" height="3.25em">
                                        <Td maxW="125px" isTruncated>
                                            <Link as={LinkRouter} to={`/tx/${tx.hash || tx.transactionHash}`} color="blue.500" className="underline" style={{ textDecoration: "none" }}>
                                                {/*paginationSettings.pageSize * paginationSettings.curPage + index}: {tx.hash || tx.transactionHash*/}
                                                {tx.hash || tx.transactionHash}
                                            </Link>
                                        </Td>

                                        <Td maxW="80px" isNumeric isTruncated>
                                            <Link as={LinkRouter} to={`/block/${parseInt(tx.blockNum, 16 || tx.blockNumber)}`} color="blue.500" className="underline" style={{ textDecoration: "none" }}>
                                                {parseInt(tx.blockNum || tx.blockNumber, 16)}
                                            </Link>
                                        </Td>

                                        <Td maxW="100px">
                                            {getTimeAgo((new Date(tx.metadata.blockTimestamp).valueOf()) / 1000) || getTimeAgo(tx.metadata.timestamp)}
                                        </Td>

                                        <Td maxW="75px">
                                            <Tag size='md' bg={colors.backgroundColorGray50} fontSize={11} fontWeight="700" letterSpacing="0.1px">
                                                <TagLabel>{tx.category}</TagLabel>
                                            </Tag>
                                        </Td>

                                        <Td maxW="100px" isTruncated>
                                            <Link as={LinkRouter} to={`/address/${tx.from}`} color="blue.500" className="underline" style={{ textDecoration: "none" }}>
                                                {tx.from}
                                            </Link>
                                        </Td>
                                        <Td maxW="50px">
                                            {filterBy === "address" ?
                                                <Tag size='md' bg={tx.from === addressHash ? colors.backgroundColorOrange50 : colors.backgroundColorGreen} px={tx.from === addressHash ? "1em" : "1.5em"} fontSize={11} fontWeight="700" letterSpacing="0.1px">
                                                    <TagLabel>{tx.from === addressHash ? "OUT" : "IN"}</TagLabel>
                                                </Tag> :
                                                <Tag size='md' bg={colors.backgroundColorGreen} borderRadius="1.25em" fontSize={11} fontWeight="700" letterSpacing="0.1px">
                                                    <TagLabel><ArrowForwardIcon /></TagLabel>
                                                </Tag>
                                            }
                                        </Td>

                                        <Td maxW="100px" isTruncated>
                                            <Link as={LinkRouter} to={`/address/${tx.to}`} color="blue.500" className="underline" style={{ textDecoration: "none" }}>
                                                {tx.to}
                                            </Link>
                                        </Td>

                                        <Td maxW="100px" textAlign="right" isNumeric isTruncated>
                                            {`${tx.value !== null ? (tx.asset === "ETH" || tx.asset === "WETH" ? parseFloat(tx.value).toFixed(4) : 0) : 0} ETH`}
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


export { TxnsFilter as default };