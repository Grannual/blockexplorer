import { useState, } from 'react';
import { Text, Box, Container, Grid, GridItem, Link, Tooltip, Divider, } from "@chakra-ui/react";
import { PiArticleLight } from "react-icons/pi";
import { Utils } from "alchemy-sdk";
import { Link as LinkRouter } from "react-router-dom";

import { Colors, getTimeAgo } from './usefulScripts';

export default function Transaction({ index, tx, timestamp }) {
    const colors = Colors();
    const [timeAgoString, setTimeAgoString] = useState(() => getTimeAgo(timestamp));

    return (
        <Container maxW="100%" px={3} mx={1} fontSize={14} fontWeight="medium">
            <Grid
                h='75px' gap={1}
                templateRows='repeat(2, 1fr)' templateColumns='repeat(6, 1fr)'
            >

                <GridItem rowSpan={2} colSpan={2} alignSelf='center' justifySelf='flex-start' display="flex" flexDirection="row" alignItems="center">
                    <Box bg={colors.backgroundColorGray50} borderRadius={10} p={2} >
                        <PiArticleLight size={25} />
                    </Box>
                    <Box justifySelf='flex-start' display="flex" flexDirection="column" justifyContent="center" alignItems="flex-start" mx={2} >
                        <Link as={LinkRouter} to={`tx/${tx.transactionHash}`} className="underline" maxW="75px" color={colors.urlColorBlue} noOfLines={1} mb={1} >
                            {tx.transactionHash}
                        </Link>
                        <Text fontSize={11} color={colors.secondaryTextColor}>{timeAgoString}</Text>
                    </Box>
                </GridItem>

                <GridItem rowSpan={2} colSpan={3} alignSelf='center' display="flex" flexDirection="column" justifyContent="center" alignItems="flex-start" >
                    <Box my={1} display="flex" flexDirection="row">
                        <Box mr={2} whiteSpace="nowrap" >From </Box>
                        <Link as={LinkRouter} className="underline" to={`/address/${tx.from}`} color={colors.urlColorBlue} width="105px" maxW="125vw" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" >
                            <Tooltip hasArrow label={tx.from} placement='top' borderRadius={5} fontSize={13} noOfLines={1}>
                                <span style={{ fontSize: 14 }}>{tx.from}</span>
                            </Tooltip>
                        </Link>
                    </Box>
                    <Box display="flex" flexDirection="row">
                        <Box mr={2} whiteSpace="nowrap" >To </Box>
                        <Link as={LinkRouter} className="underline" to={`/address/${tx.to}`} maxW="125px" color={colors.urlColorBlue} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" mb={1}>
                            <Tooltip hasArrow label={tx.to} placement='top' borderRadius={5} fontSize={13} noOfLines={1}>
                                <span style={{ fontSize: 14 }}>{tx.to}</span>
                            </Tooltip>
                        </Link>
                    </Box>
                </GridItem>

                <GridItem rowSpan={2} colSpan={1} alignSelf='center' justifySelf='center' fontSize={12} borderRadius={5} borderWidth={1} p={1}>
                    <Tooltip hasArrow offset={[0, 12]} label={`Tx Fee: ${Utils.formatEther(tx.txFee._hex.toString())} ETH`} placement='top' borderRadius={5} fontSize={12}>
                        <Box display="flex">
                            <Box as="span" width="50px" noOfLines={1}>{`${Utils.formatEther(tx.txFee._hex.toString())} `}</Box>
                            <Box as="span">ETH</Box>
                        </Box>
                    </Tooltip>
                </GridItem>

            </Grid>
            {
                index !== 5 ? <Divider /> : null
            }
        </Container>
    )
}