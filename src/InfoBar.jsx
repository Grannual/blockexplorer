import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Flex, Container,
    IconButton, Text, Input, InputGroup, InputLeftElement, FormControl,
    useColorModeValue, useColorMode,
} from "@chakra-ui/react";
import { SearchIcon, SunIcon, MoonIcon } from "@chakra-ui/icons";
import { Utils } from "alchemy-sdk";
import { Colors, getFeeData, useInterval, } from './usefulScripts';


export default function InfoBar({ searchValue, setSearchValue }) {
    const { colorMode, toggleColorMode } = useColorMode();
    const colors = Colors();
    const navigate = useNavigate();
    const [feeData, setFeeData] = React.useState(null);

    const isAddress = (hash) => {
        // Assuming a txHash is 64 characters or more, while address is only 40.
        if (hash.length === 42) {
            return true;
        }
        return false;
    }

    const handleSearch = async (value) => {
        try {
            if (Utils.isHexString(value)) {

                if (isAddress(value)) {
                    // Address route
                    setSearchValue('');
                    return navigate(`/address/${value}`)
                } else if (value.length >= 42) {
                    // Tx route
                    setSearchValue('');
                    // Forward to url
                    return navigate(`/tx/${value}`);
                }
            }

            // Block route
            const regex = /^(0x)?[0-9]+$/;
            if (regex.test(value)) {
                if (Utils.isHexString(value)) {
                    value = Utils.hexStripZeros(value).split("x")[1];
                }
                setSearchValue('');
                // Forward to url
                return navigate(`/block/${value}`);
            } else {
                return alert("Expecting a valid input, i.e. 1234, 0x1234, ...", value);
            }

        } catch (err) {
            console.error(`search value error: ${err}`);
            return navigate(`/error?error=search value error: ${err}`);
        }
    };

    useInterval(async () => {
        setFeeData(await getFeeData());
    }, 5000)

    return (
        <Box>
            <Flex
                bg={useColorModeValue('white', 'gray.800')}
                color={useColorModeValue('gray.600', 'white')}
                minH={'60px'}
                py={{ base: 2 }}
                px={{ base: 4 }}
                borderBottom={1}
                borderStyle={'solid'}
                borderColor={useColorModeValue('gray.200', 'gray.900')}
                align={'center'}>

                <Container maxW="95%">
                    <Flex flex={{ base: 1 }} justify={{ base: 'space-between', md: 'space-between' }} alignItems={"center"} fontWeight={500}>
                        <Text fontSize={13}>Gas: <Text as="span" color={colors.urlColorBlue}>{feeData !== null ? Math.ceil(parseFloat(Utils.formatUnits(parseInt(feeData.lastBaseFeePerGas._hex, 16), 9))) : null} Gwei</Text></Text>
                        <Flex flexDirection={"row"} justify={{ base: 'space-around', md: 'space-around' }} alignItems={"center"} >
                            <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} handleSearch={handleSearch} />
                            <IconButton
                                variant='outline'
                                colorScheme='gray'
                                size="sm"
                                aria-label='Toggle theme'
                                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                                onClick={toggleColorMode}
                            />

                        </Flex>
                    </Flex>
                </Container>
            </Flex>
        </Box>
    )
}



const SearchBar = ({ searchValue, setSearchValue, handleSearch }) => {


    const handleKeyDown = async (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            // Submit search value
            await handleSearch(e.target.value);
        }
    }

    return (
        <Box minWidth={"40vw"} marginRight={3}>
            <FormControl >
                <InputGroup size="sm" >
                    <InputLeftElement
                        pointerEvents="none"
                        children={<SearchIcon color={useColorModeValue("gray.600")} />}
                    />
                    <Input
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        type="text"
                        placeholder="Search...by Address/Txn Hash/Block"
                        //border="0.25px solid gray.700" boxShadow="0 0 3px 0px "
                        borderRadius={10}
                    />

                </InputGroup>

            </FormControl>
        </Box>
    );
};
