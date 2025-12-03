// App.tsx
import "./global.css"; 
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context"; // <--- IMPORT THIS
import { AuthProvider } from "./src/context/AuthContext";
import { SurveyProvider } from "./src/context/SurveyContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { createLesionsTable } from "./src/database/lesions-table";
import { useNetworkSync } from "./src/hooks/useNetworkSync";

export default function App() {
  
  useNetworkSync();

  useEffect(() => {
    createLesionsTable();
  }, []);

  return (
    // WRAP EVERYTHING IN SafeAreaProvider
    <SafeAreaProvider> 
      <NavigationContainer>
        <AuthProvider>
          <SurveyProvider>
             <AppNavigator />
          </SurveyProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}