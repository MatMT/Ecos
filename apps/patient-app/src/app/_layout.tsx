import { Stack } from "expo-router"; 
import { HeaderShownContext } from "expo-router/build/react-navigation";

export default function RootLayout () {
    return (
        <Stack>
            <Stack.Screen name="(protected)/(tabs)" options={{headerShown: false}}/>
            <Stack.Screen name="(auth)/login" options={{headerShown: false}}/>
        </Stack>
    );
}