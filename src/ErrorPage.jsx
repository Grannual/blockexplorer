'use client'
import { useRouteError, Link as LinkRouter, useLocation } from "react-router-dom";
import { Box, Heading, Text, Button } from '@chakra-ui/react'

export default function ErrorPage() {
    let location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const errorReason = searchParams.get('error') || null;

    const error = useRouteError();
    let title = 'Error ' + error.status, message = error.statusText || error.message;

    // Check for route-related error (404) or network-related error
    const isNetworkError = !navigator.onLine;

    if (isNetworkError) {
        title = 'Network Error'
        message = 'Please check your internet connection and try again.';
    }

    return (
        <Box id="error-page" textAlign="center" py={10} px={6}>
            <Heading
                display="inline-block"
                as="h2"
                size="2xl"
                bgGradient="linear(to-r, teal.400, teal.600)"
                backgroundClip="text">
                {title}
            </Heading>
            <Text fontSize="18px" mt={3} mb={2}>
                {message}
            </Text>
            <Text color={'gray.500'} mb={6}>
                {errorReason !== null ?
                    errorReason :
                    error.error.message || null
                }
            </Text>

            <Button
                as={LinkRouter}
                to={"/"}
                colorScheme="teal"
                bgGradient="linear(to-r, teal.400, teal.500, teal.600)"
                color="white"
                variant="solid"
            >
                Go to Home
            </Button>
        </Box>
    );
}