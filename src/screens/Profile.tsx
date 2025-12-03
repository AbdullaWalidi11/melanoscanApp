import React from "react";
import { View, Text, Button } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

type Props = {
  navigation: HomeScreenNavigationProp;
};

export default function Profile({ navigation }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>MelanoScan</Text>
      <Button title="Scan" onPress={() => navigation.navigate("Disclaimer")} />
    </View>
  );
}
