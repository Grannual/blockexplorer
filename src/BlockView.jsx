import { useState, useEffect } from 'react';
import {
    Box, Grid, GridItem, Text, Heading, Divider, Link,
    Card, CardBody,
    Tag, TagLabel,
} from "@chakra-ui/react";
import { CheckIcon, TimeIcon, } from '@chakra-ui/icons';
import {
    Link as LinkRouter,
    useLoaderData,
    useParams,
} from "react-router-dom";
import { Utils } from "alchemy-sdk";

import { Colors, formatNumber, getBlockData, getTimeAgo, calculateBlockRewardByBlockReceipt } from './usefulScripts';

async function loader({ params }) {
    const blockNo = params.blockNo;
    let block = await getBlockData(parseInt(blockNo));

    // Calculate miner fees, and get the block receipt
    const data = await calculateBlockRewardByBlockReceipt(block);

    return {
        ...block,
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
            _hex: block.number >= 12965000 ? data.burntFees.toHexString() : null,
            isBigNumber: block.number >= 12965000 ? data.burntFees._isBigNumber : false,
        },
        blockReceipt: data.blockReceipt,
    };
}

const BlockView = ({ block }) => {
    const colors = Colors();
    let { blockNo } = useParams();
    const blockData = useLoaderData();
    const [Block, setBlock] = useState(null);

    useEffect(() => {
        //console.log("<blockView /> mounted.");
        setBlock(blockData);
    }, [])


    if (Block !== null && Block !== undefined && block.finalized !== null && block.safe !== null) {
        if (Block.number <= parseInt(block.finalized.number)) {
            Block.status = "Finalized";

        } else if (Block.number <= block.safe.number) {
            Block.status = "Unfinalize(safe)";

        } else {
            Block.status = "Unfinalize";
        }
    }

    const templateRowNumber = Block !== undefined && Block !== null ? (Block.number >= 12965000 ? 15 : 14) : 15;
    return (

        <Box >

            {Block !== undefined && Block !== null ? (
                <>
                    <Heading size='md' textAlign={"start"} m={3} py={3}>
                        Block <span style={{ marginLeft: 5, verticalAlign: 'baseline', fontSize: 13.5, fontWeight: 17, color: colors.secondaryTextColor }}>#{blockNo}</span>
                    </Heading>

                    <Divider m={3} />

                    <Card width={{ base: "100%" }} m={3} mt={5} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"}>
                        <CardBody >

                            <Grid
                                gap={3}
                                templateRows={`repeat(${templateRowNumber}, 1fr)`} templateColumns='repeat(4, 1fr)'
                                fontSize="0.875rem"
                            >
                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Block Height:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {blockNo}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Status:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {Block.status === "Finalized" ?
                                            <Tag size='md' bg={colors.backgroundColorGreen} fontSize={11}>
                                                <CheckIcon marginRight={1} />
                                                <TagLabel>{Block.status}</TagLabel>
                                            </Tag>
                                            :
                                            <Tag size='md' bg={colors.backgroundColorGray50} fontSize={11}>
                                                <TimeIcon marginRight={1} />
                                                <TagLabel>{Block.status}</TagLabel>
                                            </Tag>
                                        }
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Timestamp:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start' >
                                    <Text pt='2'>
                                        <TimeIcon size="sm" mr={2} mb={1} />{getTimeAgo(Block.timestamp)} ({new Date(parseInt(Block.timestamp) * 1000).toUTCString()})
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Transactions:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Link as={LinkRouter} to={`/txs?block=${parseInt(Block.number, 16)}`} className="underline" color={colors.urlColorBlue} mb={1} >
                                        <Text pt='2' >
                                            {Block.transactions.length} transactions
                                        </Text>
                                    </Link>
                                </GridItem>

                                <GridItem colSpan={4}><Divider my={3} /></GridItem>


                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Fee Recipient:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start' display="flex" alignItems="baseline">

                                    <Box maxW="150px" pt='2' style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Link as={LinkRouter} to={`/address/${Block.miner}`} className="underline" color={colors.urlColorBlue} >
                                            {Block.miner + ' '}
                                        </Link>
                                    </Box>
                                    <Text ml="2">in 12 secs</Text>

                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Block Reward:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {
                                            `${Utils.formatEther(Block.blockReward._hex.toString())} ETH  
                                        (
                                            ${Utils.formatEther(Block.staticBlockReward._hex.toString())} 
                                            + ${Utils.formatEther(Block.totalTxFees._hex.toString())}
                                         - ${Utils.formatEther(Block.isBigNumber ? Block.burntFees._hex.toString() : 0)}
                                         )`
                                        }
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Total Difficulty:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {formatNumber(parseInt(Block.totalDifficulty, 16))}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Size:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {formatNumber(parseInt(Block.size, 16))} Bytes
                                    </Text>
                                </GridItem>


                                <GridItem colSpan={4}><Divider my={3} /></GridItem>


                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Gas Used:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2'  >
                                        {formatNumber(parseInt(Block.gasUsed, 16))}
                                        <Box as="span" style={{ color: colors.secondaryTextColor, marginRight: "1rem" }}>
                                            {` (${(parseInt(Block.gasUsed, 16) / parseInt(Block.gasLimit, 16) * 100).toFixed(2)}%)`}
                                        </Box>
                                        {
                                            parseFloat(parseInt(Block.gasLimit, 16) / 2 - parseInt(Block.gasUsed, 16)) > 0.00 ?
                                                <span style={{ color: colors.redTextColor }}>
                                                    {`-${(50 - parseInt(Block.gasUsed, 16) / parseInt(Block.gasLimit, 16) * 100).toFixed(0)}% Gas Target `}
                                                </span> :
                                                <span style={{ color: colors.backgroundColorGreen500 }}>
                                                    {`+${(parseInt(Block.gasUsed, 16) / parseInt(Block.gasLimit, 16) * 100).toFixed(0)}% Gas Target `}
                                                </span>
                                        }
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Gas Limit:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {formatNumber(parseInt(Block.gasLimit, 16))}
                                    </Text>
                                </GridItem>
                                {Block.number >= 12965000 ?
                                    <>
                                        <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                            <Text pt='2' className='secondary-grey' >
                                                Base Fee Per Gas:
                                            </Text>
                                        </GridItem>
                                        <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                            <Text pt='2' >
                                                {`${parseFloat(Utils.formatEther(Block.baseFeePerGas)).toFixed(18)} ETH (${parseFloat(Utils.formatUnits(Block.baseFeePerGas, 9))} Gwei)`}
                                            </Text>
                                        </GridItem>


                                        <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                            <Text pt='2' className='secondary-grey' >
                                                Burnt Fees:
                                            </Text>
                                        </GridItem>
                                        <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                            <Text pt='2' >
                                                {`${parseFloat(Utils.formatEther(Block.burntFees._hex.toString())).toFixed(18)} ETH `}
                                            </Text>
                                        </GridItem>
                                    </> : null
                                }
                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey' >
                                        Extra Data:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {`(Hex: ${Block.extraData})`}
                                    </Text>
                                </GridItem>

                            </Grid>
                        </CardBody>
                    </Card>

                    <Card width={{ base: "100%" }} m={3} mt={5} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"}>
                        <CardBody >

                            <Grid
                                gap={3}
                                templateRows='repeat(5, 1fr)' templateColumns='repeat(4, 1fr)'
                                fontSize="0.875rem"
                            >
                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Hash:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {Block.hash}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Parent Hash:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {Block.parentHash}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        StateRoot:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {Block.stateRoot || ""}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        WithdrawalsRoot:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {Block.withdrawalsRoot || ""}
                                    </Text>
                                </GridItem>

                                <GridItem colSpan={1} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' className='secondary-grey'>
                                        Nonce:
                                    </Text>
                                </GridItem>
                                <GridItem colSpan={3} alignSelf='center' justifySelf='flex-start'>
                                    <Text pt='2' >
                                        {Utils.hexStripZeros(Block.nonce) === "0x" ? "0x0" : Utils.hexStripZeros(Block.nonce)}
                                    </Text>
                                </GridItem>

                            </Grid>
                        </CardBody>
                    </Card>
                </>
            ) : null
            }

        </Box>

    );
};

export { loader, BlockView as default };

