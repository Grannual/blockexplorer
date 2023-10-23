import { useState, useEffect } from 'react';
import {
    Box, Grid, GridItem, Text, Heading, Divider, Image, Button,
    Card, CardBody,
    Input, Link,
    Menu, MenuButton, MenuList, MenuItem,
    Tag, TagLabel,
    Skeleton, SkeletonCircle, SkeletonText,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    useColorModeValue,
} from "@chakra-ui/react";
import { ChevronDownIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import {
    Link as LinkRouter,
    useNavigate,
    useParams,
    useLoaderData,
} from "react-router-dom";
import { BigNumber, Utils } from 'alchemy-sdk';

import { Colors, formatNumber, getTimeAgo, getTokensForOwner, getTransactionsByAddress, getAddressBalance } from './usefulScripts';
import etherIcon from './ethereum-thumbnail.png';



async function loader({ params }) {
    const addressHash = params.addressHash;
    const tokensMetaResponse = await getTokensForOwner(addressHash);
    const [response, firstTxnSent, lastTxnSent] = await getTransactionsByAddress(addressHash);
    const txnsByAddress = response.transfers;

    return { tokensMetaResponse, txnsByAddress, firstTxnSent, lastTxnSent };
}

const AddressView = ({ }) => {
    const navigate = useNavigate();
    const colors = Colors();
    let { addressHash } = useParams();
    const { tokensMetaResponse, txnsByAddress, firstTxnSent, lastTxnSent } = useLoaderData();

    const [tokensMeta, setTokensMeta] = useState(null);
    const [addressTxns, setAddressTxns] = useState(null);
    const [firstNLastTxnSent, setFirstNLastTxnSent] = useState(null)


    useEffect(() => {
        // Error handling
        if (
            (!Utils.isHexString(addressHash) && addressHash.length !== 40)
            || (Utils.isHexString(addressHash) && addressHash.length !== 42)
        ) {
            return navigate(`/error?error=Invalid address=${addressHash}`);
        }

        setTokensMeta(tokensMetaResponse);
        setAddressTxns(txnsByAddress);
        setFirstNLastTxnSent({
            first: firstTxnSent,
            last: lastTxnSent,
        })
    }, [])


    return (

        <Box >

            {addressHash !== undefined && addressHash !== null ? (
                <>
                    <Heading size='md' textAlign={"start"} m={3} py={3}>
                        Address <span style={{ marginLeft: 5, verticalAlign: 'baseline', fontSize: 13.5, fontWeight: 17, color: colors.secondaryTextColor }}>#{addressHash}</span>
                    </Heading>

                    <Divider m={3} />

                    <Box display="flex">
                        <Overview addressHash={addressHash} tokensMeta={tokensMeta} />
                        <MoreInfo firstNLastTxnSent={firstNLastTxnSent} />
                    </Box>

                    <TxnsTable addressHash={addressHash} addressTxns={addressTxns} />
                </>
            ) : null
            }

        </Box>

    );
};

const TxnsTable = ({ addressHash, addressTxns }) => {
    const navigate = useNavigate();
    const colors = Colors();
    const addressTxnsByExternal = addressTxns !== null ? addressTxns.filter(tx => tx.category === "external") : null;

    return (
        <Card width={{ base: "100%" }} m={3} mt={5} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"}>

            <CardBody p={0}>
                <Text m="5" ml="4" mb="2" fontSize="sm" fontWeight="semibold">{`Latest ${addressTxnsByExternal !== null ? (addressTxnsByExternal.length >= 25 ? 25 : addressTxnsByExternal.length) : ""} from a total of ${addressTxnsByExternal !== null ? formatNumber(addressTxnsByExternal.length) : ""} transactions`}</Text>
                <TableContainer>
                    <Table variant='simple' size="sm" >
                        <Thead >
                            <Tr mb={2} height="3em">
                                <Th maxW="100px">Transaction Hash</Th>
                                <Th maxW="80px" isNumeric>Block</Th>
                                <Th maxW="100px">Age</Th>
                                <Th maxW="100px">From</Th>
                                <Th maxW="60px"></Th>
                                <Th maxW="100px">To</Th>
                                <Th maxW="80px" isNumeric>Value</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {addressTxnsByExternal !== null && addressTxnsByExternal.slice(0, 25).map((tx, index) => (
                                <Tr key={`tr_${index}`} fontSize="sm" height="3.25em">
                                    <Td maxW="150px" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Link as={LinkRouter} to={`/tx/${tx.hash}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                            {tx.hash}
                                        </Link>
                                    </Td>
                                    <Td maxW="80px" isNumeric style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Link as={LinkRouter} to={`/block/${parseInt(tx.blockNum, 16)}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                            {parseInt(tx.blockNum, 16)}
                                        </Link>
                                    </Td>
                                    <Td maxW="200px"                                    >
                                        {getTimeAgo((new Date(tx.metadata.blockTimestamp).valueOf()) / 1000)}</Td>
                                    <Td maxW="100px" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Link as={LinkRouter} to={`/address/${tx.from}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                            {tx.from}
                                        </Link>
                                    </Td>
                                    <Td maxW="60px" textAlign='center' style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Tag size='md' bg={tx.from === addressHash ? colors.backgroundColorOrange50 : colors.backgroundColorGreen} px={tx.from === addressHash ? "1em" : "1.5em"} fontSize={11} fontWeight="700" letterSpacing="0.1px" >
                                            <TagLabel>{tx.from === addressHash ? "OUT" : "IN"}</TagLabel>
                                        </Tag>

                                    </Td>
                                    <Td maxW="100px" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Link as={LinkRouter} to={`/address/${tx.to}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                            {tx.to}
                                        </Link>
                                    </Td>
                                    <Td maxW="100px"
                                        textAlign="right"
                                        isNumeric
                                    >
                                        {`${tx.value !== null ? parseFloat(tx.value).toFixed(4) : 0} ETH`}
                                    </Td>

                                </Tr>
                            ))}
                        </Tbody>

                    </Table>
                </TableContainer>
            </CardBody>
            <Button size="sm" width="100%" m={0} py={5} onClick={() => navigate(`/txs?a=${addressHash}`)}>
                View All Transactions <ArrowForwardIcon ml={1} />
            </Button>
        </Card >
    )
}

const MoreInfo = ({ firstNLastTxnSent }) => {
    const colors = Colors();

    return (
        <Card width={{ base: "45%" }} m={3} mt={5} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"}>
            <CardBody >
                <Heading size='xs' textTransform='uppercase' mb={2}>
                    More Info
                </Heading>
                <Grid
                    gap={0}
                    templateRows={`repeat(4, 1fr)`} templateColumns='repeat(4, 1fr)'
                    fontSize="0.75rem"
                >
                    <GridItem colSpan={4} alignSelf='center' justifySelf='flex-start'>
                        <Text pt='2' className='secondary-grey' textTransform='uppercase'>
                            Last Txn Sent
                        </Text>
                    </GridItem>
                    <GridItem colSpan={4} alignSelf='center' justifySelf='flex-start' display="flex" justifyContent="flex-start" alignItems="center" >

                        <Text width="200px" fontSize="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {firstNLastTxnSent !== null && firstNLastTxnSent.last !== undefined ?
                                <Link as={LinkRouter} to={`/tx/${firstNLastTxnSent.last.hash}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                    {firstNLastTxnSent.last.hash}
                                </Link>
                                : ""}
                        </Text>

                        <Text>{` ${firstNLastTxnSent !== null && firstNLastTxnSent.last !== undefined ? 'from ' + getTimeAgo((new Date(firstNLastTxnSent.last.metadata.blockTimestamp).valueOf()) / 1000) : ""}`}</Text>
                    </GridItem>

                    <GridItem colSpan={4} alignSelf='center' justifySelf='flex-start'>
                        <Text pt='2' className='secondary-grey' textTransform='uppercase'>
                            First Txn Sent
                        </Text>
                    </GridItem>
                    <GridItem colSpan={4} alignSelf='center' justifySelf='flex-start' display="flex" justifyContent="flex-start" alignItems="center">
                        <Text width="200px" fontSize="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {firstNLastTxnSent !== null && firstNLastTxnSent.first !== undefined ?
                                <Link as={LinkRouter} to={`/tx/${firstNLastTxnSent.first.hash}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                    {firstNLastTxnSent.first.hash}
                                </Link>
                                : null}
                        </Text>
                        <Text>{`${firstNLastTxnSent !== null && firstNLastTxnSent.first !== undefined ? 'from ' + getTimeAgo((new Date(firstNLastTxnSent.first.metadata.blockTimestamp).valueOf()) / 1000) : ""}`}</Text>
                    </GridItem>

                </Grid>
            </CardBody>
        </Card>
    )
}

const Overview = ({ addressHash, tokensMeta }) => {
    const [addressETHBalance, setAddressETHBalance] = useState(null);

    useEffect(() => {
        (async () => {
            const rawBalance = await getAddressBalance(addressHash);
            const balanceInEth = Utils.formatEther(BigNumber.from(rawBalance._hex));
            let [integerPart, decimalPart] = balanceInEth.split('.');
            if (parseInt(integerPart) > 0) {
                integerPart = formatNumber(integerPart);
            }

            setAddressETHBalance(integerPart + '.' + decimalPart);
        })();
    }, []);

    return (
        <Card width={{ base: "55%" }} m={3} mt={5} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"}>
            <CardBody >
                <Heading size='xs' textTransform='uppercase' mb={2}>
                    Overview
                </Heading>
                <Grid
                    gap={0}
                    templateRows={`repeat(4, 1fr)`} templateColumns='repeat(4, 1fr)'
                    fontSize="0.75rem"
                >
                    <GridItem colSpan={4} alignSelf='center' justifySelf='flex-start'>
                        <Text pt='2' className='secondary-grey' textTransform='uppercase'>
                            ETH Balance
                        </Text>
                    </GridItem>
                    <GridItem colSpan={4} alignSelf='center' justifySelf='flex-start' display="flex" justifyContent="flex-start" alignItems="center">
                        <Image
                            borderRadius='full'
                            boxSize='1.5em'
                            src={etherIcon}
                            alt='Logo'
                            mr={2}
                        />
                        <SkeletonText fontSize="sm" isLoaded={addressETHBalance !== null} fadeDuration="1.0" skeletonHeight='4' noOfLines={1}>
                            <Box display="flex">
                                <Text width="100px" fontSize="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {addressETHBalance !== null ? addressETHBalance : ""}
                                </Text>
                                <Text fontSize="sm">ETH</Text>
                            </Box>
                        </SkeletonText>
                    </GridItem>

                    <GridItem colSpan={4} alignSelf='center' justifySelf='flex-start'>
                        <Text pt='2' className='secondary-grey' textTransform='uppercase'>
                            Token Holdings
                        </Text>
                    </GridItem>
                    <GridItem colSpan={4} alignSelf='center' justifySelf='flex-start' display="flex" justifyContent="flex-start" alignItems="center">

                        <DropdownMenu items={tokensMeta} />
                    </GridItem>

                </Grid>
            </CardBody>
        </Card>
    )
}

const DropdownMenu = ({ items }) => {
    const [searchTerm, setSearchTerm] = useState("");
    let filteredItems = [];

    if (items !== null && items.length !== 0) {
        filteredItems = items.tokens.filter((item, index) => {
            try {
                if (item.name !== undefined) {
                    if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                        if (parseFloat(item.rawBalance) > 0.0) { return item }
                    }
                } else {
                    return item;
                }
            } catch (err) {
                console.error(index, item, err)
            }
        }
        );
    }


    return (
        <Box>
            <Menu>
                <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    size="sm"
                    variant="outline"
                    width="15em"
                    textAlign="left"
                    py={5}
                    fontSize="sm"
                >
                    {`${items !== null ? items.tokens.length : 0} Tokens`}
                </MenuButton>
                <MenuList minW="15em" >
                    <Input
                        size="sm"
                        borderRadius="8" p={1} px={2} width="90%" mx={2}
                        _focus={{ boxShadow: 'outline' }}
                        placeholder="Search items"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Text borderRadius="8" backgroundColor={useColorModeValue("gray.100")} fontWeight="semibold" p={1} px={2} m={2}>{`ERC-20 Tokens (${items !== null ? items.tokens.length : 0})`}</Text>
                    <Box maxH="200px" overflowY="auto">
                        {
                            filteredItems.map((item, index) => (
                                <MenuItem key={index} display="flex" flexDirection="column" justifyContent="flex-start" alignItems="flex-start">

                                    <Box display="flex" mb={1}>
                                        <SkeletonCircle isLoaded={item.name !== undefined} fadeDuration={1} boxSize='1.5em' mr={2}>
                                            <Image
                                                borderRadius='full'
                                                boxSize='1.5em'
                                                src={item.logo ? item.logo : "https://etherscan.io/images/main/empty-token.png"}
                                                alt='Logo'
                                            />
                                        </SkeletonCircle>
                                        <Skeleton isLoaded={item.name !== undefined} fadeDuration={1} height="1.5em">
                                            <Text fontWeight="semibold">
                                                {`${item.name} ${item.symbol !== undefined ? "(" + item.symbol + ")" : ""}`}
                                            </Text>
                                        </Skeleton>
                                    </Box>
                                    <Skeleton isLoaded={item.name !== undefined} fadeDuration={1} height="1.5em">
                                        <Text>{Utils.formatUnits(item.rawBalance, 18)}{` ${item.symbol !== undefined ? item.symbol : ""}`}</Text>
                                    </Skeleton>
                                    <Divider mt={3} />
                                </MenuItem>
                            ))
                        }
                    </Box>
                </MenuList>
            </Menu>
        </Box>
    );
};

export { loader, AddressView as default };