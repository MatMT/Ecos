import Ract from "react";
import { Tabs } from "expo-router";
import {Image, StyleSheet, View} from 'react-native';

const TabLayout = () => {
    return (
        <Tabs>
            <Tabs.Screen name= 'Home'options={{headerShown: false, tabBarIcon: ({focused}) => 
                (<Image style={style.img}source={require('@/assets/icon-navbar/house-icon.png')}/>)}}/>
            <Tabs.Screen name="Stats" options={{headerShown: false,tabBarIcon: ({}) => 
                (<Image style={style.img} source={require('@/assets/icon-navbar/chart-icon.png')}/>)}}/>
            <Tabs.Screen name="Chat" options={{headerShown: false,tabBarIcon: ({}) => 
                (<Image style={style.img} source={require('@/assets/icon-navbar/message-icon.png')}/>)}}/>
            <Tabs.Screen name="Profile" options={{headerShown: false,tabBarIcon: ({}) => 
                (<Image style={style.img} source={require('@/assets/icon-navbar/user-icon.png')}/>)}}/>
        </Tabs>
    );
}

export default TabLayout;

const style = StyleSheet.create({
    img:{
        width: '100%',
        height: '90%',
        resizeMode: 'contain'
    }
}
)