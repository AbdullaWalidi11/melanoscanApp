import React, { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native"; // CHANGED: Replaces expo-router
import * as SplashScreen from "expo-splash-screen";
import { Italianno_400Regular, useFonts } from "@expo-google-fonts/italianno";
import { Montserrat_400Regular } from "@expo-google-fonts/montserrat";

// Prevent auto hiding at the module level
SplashScreen.preventAutoHideAsync();

export default function Splash() {
  const navigation = useNavigation<any>(); // CHANGED: Hook for navigation

  const [fontsLoaded, fontError] = useFonts({
    Italianno_400Regular,
    Montserrat_400Regular,
  });

  useEffect(() => {
    const prepare = async () => {
      try {
        // Wait for fonts to load
        if (fontsLoaded || fontError) {
          // 1. Hide the native white splash screen
          await SplashScreen.hideAsync();
          
          // 2. Wait 3 seconds while showing this custom Pink Animated screen
          const timer = setTimeout(() => {
            // CHANGED: Use navigation.replace instead of router.replace
            // This ensures the user cannot go "back" to the splash screen
            navigation.replace("Login"); 
          }, 3000);

          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.warn('Splash screen error:', error);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, [fontsLoaded, fontError, navigation]);

  // Show a simple spinner if fonts are somehow taking too long (fallback)
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Main splash content
  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />
      <View style={[styles.circle, styles.circle4]} />

      {/* App logo */}
      <View style={styles.logo_app_contianer}>
        <View style={styles.logo_contianer}>
          {/* CHANGED: Path adjusted for new folder depth (../../) */}
          <Image
            source={require("../../assets/images/appLogo.png")} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* App name */}
        <Text style={styles.appName}>MelanoScan</Text>
      </View>
    </View>
  );
}

// Styles remain exactly the same as your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFA3A8",
    position: "relative",
  },
  logo: {
    width: 200,
    height: 200,
    opacity: 0.9,
    zIndex: 2,
  },
  logo_contianer: {
    width: 200,
    height: 200,
    backgroundColor: "#f69da1ff", 
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    borderColor:"#FFD8D8", 
    borderWidth: 1,
    zIndex: 4,
    shadowColor: "#181717ff",
    shadowOffset: {width: 1, height: 1},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  appName: {
    fontFamily: "Italianno_400Regular",
    fontSize: 50,
    color: "#ffffffff",
    textShadowColor: "#B08C8C",
    textShadowOffset: { width: 2, height: 1 },
    textShadowRadius: 1,
    zIndex: 2,
    marginTop: 20, 
  },
  circle: {
    position: "absolute",
    backgroundColor: "#FFB7BB",
    zIndex: 1,
  },
  circle1: {
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 0,
    left: 240,
  },
  circle2: {
    width: 100,
    height: 100,
    borderRadius: 100,
    top: 100,
    left: 40,
  },
  circle3: {
    width: 100,
    height: 100,
    borderRadius: 100,
    bottom: -50,
    right: 40,
  },
  circle4: {
    width: 220,
    height: 220,
    borderRadius: 200,
    bottom: 50,
    left: -70,
  },
  logo_app_contianer: {
    alignItems: "center",
  }
});