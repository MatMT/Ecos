import {View, Text, TextInput, StyleSheet, Image, TouchableOpacity} from 'react-native';
import React from 'react';
import { router } from 'expo-router';

function Login () {
    const handleLogin = () => {
        router.replace('/(protected)/(tabs)/Home');
    };

    return (
        <View style={style.container}>
            <Image source={require("@/assets/logo_nexo_ecos.png")} style={style.image}></Image>
            <View style={style.card}>
                <TextInput style={style.UserInput} placeholder='Ingrese su usuario'></TextInput>
                <TextInput style={style.UserPass} placeholder='Ingreses su contraseña'></TextInput>
                <TouchableOpacity style={style.buttom} onPress={handleLogin}>
                    <Text style= {{color: '#ffff', textAlign: 'center', fontWeight: 'bold'}}>INICIAR SESIÓN</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#47ACA0',
        alignItems: 'center',
        justifyContent: 'center'
    },
    card: {
        
        backgroundColor: '#ffff',
        width: '90%',
        height: '37%',
        marginTop: '5%',
        alignItems: 'center',
        borderRadius: 20,
        justifyContent: 'center'
        
        
    },
    image: {
        width: '80%',
        height: '25%',
        marginTop: '5%'
    },
    UserInput : {
        
        backgroundColor: '#f0f0f0f0',
        borderRadius: 15,
        width: '80%',
        height: '16%',
        marginTop: '0%',
        paddingLeft: '7%'
         
    },
    UserPass: {
        
        backgroundColor: '#f0f0f0f0',
        borderRadius: 15,
        width: '80%',
        height: '16%',
        marginTop: '8%',
        textAlign: 'left',
        paddingLeft: '7%'
    },
    buttom: {
        backgroundColor: '#29364C',
        width: '80%',
        height: '18%',
        marginTop: '13%',
        borderRadius: 50,
        justifyContent: 'center'
    }

})

export default Login;