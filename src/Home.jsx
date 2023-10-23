import {
  Text, Box, Container, Flex, Grid, GridItem, Divider, Button,
  Skeleton, SkeletonCircle, SkeletonText,
  Heading, Card, CardHeader,
} from "@chakra-ui/react"
import { ArrowForwardIcon } from '@chakra-ui/icons';
import LatestDataDisplay from './LatestDataDisplay';
import { Colors, } from './usefulScripts';


function Home({ historicalLatestBlocks, }) {
  const numberOfRows = 6;

  const generateSkeletonRow = (index, name) => {
    const isloaded = historicalLatestBlocks.length !== 0;
    return (
      <Container key={`${name}SkeletonRow_${index}`} maxW="100%" px={3} mx={1} fontSize={14} fontWeight="medium">
        <Grid
          h='75px' gap={1}
          templateRows='repeat(2, 1fr)' templateColumns='repeat(6, 1fr)'
        >

          <GridItem rowSpan={2} colSpan={2} alignSelf='center' justifySelf='flex-start' display="flex" flexDirection="row">
            <Box borderRadius={10} p={3} >
              {/*<PiCubeFocusLight size={25} />*/}
              <SkeletonCircle size="45" borderRadius="10" isLoaded={isloaded} fadeDuration={1} />
            </Box>

            <Box justifySelf='flex-start' display="flex" flexDirection="column" justifyContent="center" alignItems="flex-start" mx={2} >
              <SkeletonText isLoaded={isloaded} fadeDuration={1}>
                block Number
                <Text fontSize={11} color="rgb(105,105,105)">timestamp</Text>
              </SkeletonText>
            </Box>

          </GridItem>

          <GridItem rowSpan={2} colSpan={3} alignSelf='center' display="flex" flexDirection="column" justifyContent="center" alignItems="flex-start" >
            <SkeletonText isLoaded={isloaded} fadeDuration={1}>
              <Box my={0} display="flex" flexDirection="row">
                <Box mr={2} whiteSpace="nowrap" >Fee Recipient </Box>
                <span style={{ fontSize: 14 }}>miner</span>
              </Box>
              <Box>
                <span>101 txns</span>
                <span style={{ color: "rgb(105,105,105)", fontSize: 13 }}> in 12 secs</span>
              </Box>
            </SkeletonText>
          </GridItem>

          <GridItem rowSpan={2} colSpan={1} alignSelf='center' justifySelf='center' fontSize={12} borderRadius={5} borderWidth={1} p={1}>
            <SkeletonText isLoaded={isloaded} fadeDuration={1}>
              {`blockreward 101 ETH`}
            </SkeletonText>
          </GridItem>

        </Grid>
        {
          index !== 5 ? <Divider /> : null
        }

      </Container>
    )
  }


  return (
    <Box>

      <Flex direction={{ base: 'column', lg: 'row' }} justify={{ base: 'center', md: 'space-between' }} align={'center'} pt={5} my={3}>

        {historicalLatestBlocks.length !== 0 ?

          <>
            <LatestDataDisplay key="blockView" Header={"Latest Blocks"} Blocks={historicalLatestBlocks.slice(0, 6)} />

            <LatestDataDisplay key="txsView" Header={"Latest Transactions"} Blocks={historicalLatestBlocks.slice(0, 6)} />
          </>

          :
          <>
            <Card width={{ base: "100%" }} mx={3} mb={3} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"} >
              <CardHeader p={3} pl={4} pt={4}>
                <Heading size='sm' textAlign={"start"}>Latest Blocks</Heading>
              </CardHeader>
              {Array.from({ length: numberOfRows }, (_, index) => generateSkeletonRow(index, "block"))}
              <Divider />
              <Skeleton>
                <Button size="sm" height="3.5em" width="100%" m={0} py={5} borderRadius="0 0 12px 12px" bg={Colors.backgroundColorGray50}>
                  {`View All Blocks`} <ArrowForwardIcon ml={1} />
                </Button>
              </Skeleton>
            </Card>

            <Card width={{ base: "100%" }} mx={3} mb={3} borderRadius={12} boxShadow={"0 0.5rem 1.2rem rgb(189 197 209 / 20%)"} border={"1px solid #e9ecef"} >
              <CardHeader p={3} pl={4} pt={4}>
                <Heading size='sm' textAlign={"start"}>Latest Transactions</Heading>
              </CardHeader>
              {Array.from({ length: numberOfRows }, (_, index) => generateSkeletonRow(index, "transaction"))}
              <Divider />
              <Skeleton>
                <Button size="sm" height="3.5em" width="100%" m={0} py={5} borderRadius="0 0 12px 12px" bg={Colors.backgroundColorGray50} >
                  {`View All Transactions`} <ArrowForwardIcon ml={1} />
                </Button>
              </Skeleton>
            </Card>
          </>
        }
      </Flex >

    </Box >

  );
}

export default Home;
