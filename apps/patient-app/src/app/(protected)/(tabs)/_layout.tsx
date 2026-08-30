import Ract from "react";
import { Tabs } from "expo-router";
import {Image, StyleSheet, View} from 'react-native';
import HomeIcon from '@/assets/icon-navbar/Home.svg';
import StatIcon from '@/assets/icon-navbar/Stat.svg';
import MessageIcon from '@/assets/icon-navbar/Message.svg';
import UserIcon from '@/assets/icon-navbar/User.svg';

const TabLayout = () => {
    return (
        <Tabs>
            <Tabs.Screen name= 'Home'options={{headerShown: false, tabBarIcon: ({focused, size}) => 
                (<HomeIcon width={'90%'} height={'100%'}/>)}}/>
            <Tabs.Screen name="Stats" options={{headerShown: false,tabBarIcon: ({}) => 
                (<StatIcon width={'90%'} height={'100%'}/>)}}/>
            <Tabs.Screen name="Chat" options={{headerShown: false,tabBarIcon: ({}) => 
                (<MessageIcon width={'90%'} height={'100%'}/>)}}/>
            <Tabs.Screen name="Profile" options={{headerShown: false,tabBarIcon: ({}) => 
                (<UserIcon width={'90%'} height={'100%'}/>)}}/>
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