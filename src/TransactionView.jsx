import { useState, useEffect } from 'react';
import {
    Link as LinkRouter,
    useLoaderData,
    useNavigate,
    useParams,
} from "react-router-dom";
import {
    Box, Image, Grid, GridItem, Link,
    Text, Heading, Divider, Card, CardBody,
    Tag, TagLabel, Code, Collapse,
    useDisclosure,
} from "@chakra-ui/react";
import { CheckIcon, TimeIcon, } from '@chakra-ui/icons';
import { PiFireFill, PiMoneyDuotone } from "react-icons/pi";
import etherIcon from './ethereum-thumbnail.png';
import { Colors, formatNumber, insertLineBreaks, getTimeAgo, calculateTxFee_BurntFee_txSavings, getTransactionByHash, getTransactionReceiptByHash, getBlockData } from './usefulScripts';
const { Utils, } = require("alchemy-sdk");

async function loader({ params }) {
    const txHash = params.txHash;

    try {
        if (Utils.isHexString(txHash)) {
            let txReceipt = await getTransactionReceiptByHash(txHash);
            const txData = await getTransactionByHash(txHash);
            const block = await getBlockData(parseInt(txReceipt.blockNumber));

            // Calculate the Tx's Fee, BurntFee, and Savings in Wei
            const [txFee, burntFee, txSavings] = calculateTxFee_BurntFee_txSavings(txData, txReceipt, block, parseInt(txData.type, 16));

            // Update the tx receipt
            txReceipt = {
                ...txReceipt,
                txFee: {
                    _hex: txFee.toHexString(),
                    isBigNumber: txFee._isBigNumber
                },
                burntFee: {
                    _hex: burntFee.toHexString(),
                    isBigNumber: burntFee._isBigNumber
                },
                txSavings: {
                    _hex: txSavings !== null ? txSavings.toHexString() : null,
                    isBigNumber: txSavings !== null ? txSavings._isBigNumber : false,
                }
            }

            return ({
                data: txData,
                receipt: txReceipt,
                block: block,
            });
        } else {
            return null;
        }
    } catch (err) {
        console.error(err)
        return null;
    }

}


const TransactionView = ({ block }) => {
    const navigate = useNavigate();
    let { txHash } = useParams();
    const txData = useLoaderData();
    if (txData === null) {
        navigate("/error?error='Failed to fetch transaction details'");
    };

    const [tx, setTx] = useState({
        data: null,
        receipt: null,
        block: null,
    });
    const { isOpen, onToggle } = useDisclosure(false);



    useEffect(() => {
        if (txData !== null) {
            setTx(txData);
        }
    }, [tx]);



    const colors = Colors();

    return (
        <Box >
            {block.latest !== null && tx.data !== null && tx.receipt !== null && tx.block !== null ? (
                <>
                    <Heading size='md' textAlign={"start"} m={3} py={3}>
                        Transaction Details
                    </Heading>

                    <Divider m={3} />

                    <Card width={{ base: "100%" }} m={3} mt={5} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"}>
                        <CardBody >

                            <Grid
                                gap={3}
                                templateRows='repeat(11, 1fr)' templateColumns='repeat(4, 1fr)'
                                fontSize="0.875rem"
                            >
                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Transaction Hash:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {tx.receipt.transactionHash}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Status:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {tx.receipt.status === 1 ?
                                            <Tag size='md' bg={colors.backgroundColorGreen} fontSize={11} mr={2} >
                                                <CheckIcon marginRight={1} />
                                                <TagLabel>Success</TagLabel>
                                            </Tag>
                                            :
                                            <Tag size='md' bg={colors.backgroundColorRed} fontSize={11}>
                                                <TimeIcon marginRight={1} />
                                                <TagLabel>Failed</TagLabel>
                                            </Tag>
                                        }
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Block:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Box pt='2' >
                                        {parseInt(block.latest.number) - parseInt(tx.block.number) > 0 ?
                                            <Box display="flex" alignItems="center">
                                                {parseInt(block.safe.number) - parseInt(tx.block.number) > 0 ?
                                                    <CheckIcon color={colors.backgroundColorGreen500} mr={1} boxSize="0.75em" rounded />
                                                    :
                                                    <TimeIcon boxSize="0.75em" mr={1} />
                                                }
                                                <Link as={LinkRouter} to={`/block/${tx.block.number}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                                    <Text mr={2}>{tx.block.number}</Text>
                                                </Link>
                                                <Tag size='md' bg={colors.backgroundColorGray50} fontSize={10} fontWeight="700" letterSpacing="0.1px"  >
                                                    <TagLabel>{`${tx.receipt.confirmations} Block Confirmation${tx.receipt.confirmations > 1 ? 's' : ""}`}</TagLabel>
                                                </Tag>
                                            </Box>
                                            :
                                            <Tag size='md' bg={colors.backgroundColorRed} fontSize={11}>
                                                <TimeIcon mr={1} />
                                                <TagLabel>Failed</TagLabel>
                                            </Tag>
                                        }
                                    </Box>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Timestamp:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start' >
                                    <Text pt='2'>
                                        <TimeIcon size="sm" mr={2} mb={1} />{getTimeAgo(tx.block.timestamp)} ({new Date(parseInt(tx.block.timestamp) * 1000).toUTCString()})
                                    </Text>
                                </GridItem>


                                <GridItem colSpan={4}><Divider mt={5} /></GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Method:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start' >
                                    <Text maxW="10em" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" pt='2'>
                                        {tx.data.input === "0x" ? "0x0" : tx.data.input}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={4}><Divider mt={4} /></GridItem>


                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        From:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Link as={LinkRouter} to={`/address/${tx.receipt.from}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                        <Text pt='2' >
                                            {tx.receipt.from}
                                        </Text>
                                    </Link>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        to:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Link as={LinkRouter} to={`/address/${tx.receipt.to}`} color={colors.urlColorBlue} className="underline" style={{ textDecoration: "none" }}>
                                        <Text pt='2' >
                                            {tx.receipt.to}
                                        </Text>
                                    </Link>
                                </GridItem>

                                <GridItem colSpan={4}><Divider my={3} /></GridItem>


                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Value:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' display="flex" alignItems="center">
                                        <Image
                                            boxSize='1rem'
                                            objectFit='cover'
                                            src={etherIcon}
                                            alt='Logo'
                                            pr={2}
                                        />
                                        {`${Utils.formatEther(tx.data.value.toString())} ETH `}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Transaction Fee:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {`${parseFloat(Utils.formatEther(tx.receipt.txFee._hex.toString()))} ETH `}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Gas Price:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {`${Utils.formatUnits(parseInt(tx.data.gasPrice, 16), 9).toString()} Gwei `}
                                        <Text as="span" color={colors.secondaryTextColor}>
                                            {`(${Utils.formatEther(parseInt(tx.data.gasPrice, 16)).toString()} ETH)`}
                                        </Text>
                                    </Text>
                                </GridItem>

                            </Grid>
                        </CardBody>
                    </Card>

                    <Card width={{ base: "100%" }} m={3} mt={5} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"}>
                        <CardBody >
                            <Collapse in={isOpen} animateOpacity>
                                <Grid
                                    gap={3}
                                    templateRows='repeat(7, 1fr)' templateColumns='repeat(4, 1fr)'
                                    fontSize="0.875rem"
                                >

                                    <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                        <Text pt='2' className='secondary-grey'>
                                            Gas Limit & Usage by Txn:
                                        </Text>
                                    </GridItem>
                                    <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                        <Box pt='2' height="2em" display="flex">
                                            {formatNumber(parseInt(tx.data.gas, 16))}
                                            <Divider orientation='vertical' mx={3} />
                                            {`${formatNumber(parseInt(tx.receipt.gasUsed._hex, 16))} (${(parseInt(tx.receipt.gasUsed._hex, 16) / parseInt(tx.data.gas, 16) * 100).toFixed(2)}%)`}
                                        </Box>
                                    </GridItem>

                                    <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                        <Text pt='2' className='secondary-grey'>
                                            Gas Fees:
                                        </Text>
                                    </GridItem>
                                    <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                        <Box pt='2' height="2em" display="flex">
                                            {`Base: ${Utils.formatUnits(parseInt(tx.block.baseFeePerGas, 16), 9)} Gwei`}
                                            {parseInt(tx.data.type, 16) === 2 ?
                                                <>
                                                    <Divider orientation='vertical' mx={3} />
                                                    {`Max: ${Utils.formatUnits(parseInt(tx.data.maxFeePerGas, 16), 9).toString()} Gwei`}
                                                    <Divider orientation='vertical' mx={3} />
                                                    {`Max Priority: ${Utils.formatUnits(parseInt(tx.data.maxPriorityFeePerGas, 16), 9).toString()} Gwei`}
                                                </> : null}
                                        </Box>
                                    </GridItem>

                                    <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                        <Text pt='2' className='secondary-grey'>
                                            Burnt & Txn Savings Fees:
                                        </Text>
                                    </GridItem>
                                    <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                        <Box pt='2' >
                                            <Box display="flex" alignItems="center">
                                                <Tag size='md' bg={colors.backgroundColorGray50} fontSize={11} fontWeight="700" letterSpacing="0.1px" mr={2} color={Colors.mainTextColor}>
                                                    <PiFireFill color={"orange"} style={{ marginRight: "0.25em" }} />
                                                    <TagLabel>{`Burnt: ${Utils.formatEther(tx.receipt.burntFee._hex)} ETH`}</TagLabel>
                                                </Tag>
                                                {parseInt(tx.data.type, 16) === 2 ?
                                                    <Tag size='md' bg={colors.backgroundColorGray50} fontSize={11} fontWeight="700" letterSpacing="0.1px" color={Colors.mainTextColor}>
                                                        <PiMoneyDuotone style={{ marginRight: "0.5em" }} />
                                                        <TagLabel>{`txnSavings: ${Utils.formatEther(tx.receipt.txSavings._hex)} ETH`}</TagLabel>
                                                    </Tag>
                                                    : null
                                                }
                                            </Box>
                                        </Box>
                                    </GridItem>

                                    <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                        <Text pt='2' className='secondary-grey'>
                                            Other Attributes:
                                        </Text>
                                    </GridItem>
                                    <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                        <Box pt='2' >
                                            <Box display="flex" alignItems="center">
                                                <Tag size='md' bg={colors.backgroundColorGray50} fontSize={11} fontWeight="700" letterSpacing="0.1px" color={Colors.mainTextColor}>
                                                    <TagLabel>{`Txn Type: ${tx.receipt.type}`}</TagLabel>
                                                </Tag>
                                                <Tag size='md' bg={colors.backgroundColorGray50} fontSize={11} fontWeight="700" letterSpacing="0.1px" color={Colors.mainTextColor} mx={2}>
                                                    <TagLabel>{`Nonce: ${parseInt(tx.data.nonce, 16)}`}</TagLabel>
                                                </Tag>
                                                <Tag size='md' bg={colors.backgroundColorGray50} fontSize={11} fontWeight="700" letterSpacing="0.1px" color={Colors.mainTextColor}>
                                                    <TagLabel>{`Position in block: ${parseInt(tx.data.transactionIndex, 16)}`}</TagLabel>
                                                </Tag>
                                            </Box>
                                        </Box>
                                    </GridItem>

                                    <GridItem rowSpan={2} colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                        <Text pt='2' className='secondary-grey'>
                                            Input Data:
                                        </Text>
                                    </GridItem>
                                    <GridItem rowSpan={2} colSpan={3} alignSelf='center' justifySelf='flex-start' display="flex">
                                        <Box borderRadius={10} style={{ height: '5em', backgroundColor: Colors.backgroundColorGray50, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                            <Code p={2} children={insertLineBreaks(tx.data.input, 64)} />
                                        </Box>
                                    </GridItem>


                                    <GridItem colSpan={4}><Divider /></GridItem>

                                </Grid>
                            </Collapse>
                            <Box display="flex" justifyContent="flex-start" alignItems="center">
                                <Text pt='2' mr="3" className='secondary-grey' fontSize="0.875rem">
                                    More Details:
                                </Text>
                                <Link alignSelf="center" className='underline' pt="2" fontSize="13" color="blue.600" _hover={{ textDecoration: "none" }} onClick={onToggle}>
                                    {isOpen ? "- Click to show less" : "+ Click to show more"}
                                </Link>
                            </Box>
                        </CardBody>
                    </Card>
                </>
            ) : null
            }

        </Box>

    );
};

export { loader, TransactionView as default };
