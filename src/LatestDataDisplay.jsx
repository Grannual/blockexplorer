import { useNavigate, } from "react-router-dom";
import {
    Heading, Divider, Button,
    Card, CardHeader, useColorModeValue,
} from "@chakra-ui/react"
import { ArrowForwardIcon } from '@chakra-ui/icons';
import Block from "./Block";
import Transaction from "./Transaction";

export default function LatestDataDisplay({ Header, Blocks }) {
    const navigate = useNavigate();
    let buttonUrl, LatestData = [];

    if (Header === "Latest Blocks") {
        buttonUrl = '/blocks';
        LatestData = Blocks.map((block, index) => {
            return (
                <Block key={`block_${index}`} index={index} block={block} />
            )
        });
    } else if (Header === "Latest Transactions") {
        buttonUrl = '/txs';
        for (let i = 0; i < 6; i++) {
            LatestData.push(
                <Transaction key={`txs_${i}`} index={i} tx={Blocks[0].blockReceipt[i]} timestamp={Blocks[0].timestamp} />
            )
        }
    }


    return (
        <Card width={{ base: "100%" }} mx={3} mb={3} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"} >
            <CardHeader p={3} pl={4} pt={4}>
                <Heading size='sm' textAlign={"start"}>{Header}</Heading>
            </CardHeader>
            <Divider />
            {
                Blocks.length !== 0 ?
                    LatestData : null
            }
            <Divider />
            <Button size="sm" height="3.5em" width="100%" m={0} py={5} borderRadius="0 0 12px 12px" bg={useColorModeValue('gray.50')} onClick={() => navigate(buttonUrl)}>
                {`View All ${Header.split(' ')[1]}`} <ArrowForwardIcon ml={1} />
            </Button>

        </Card>
    )
}