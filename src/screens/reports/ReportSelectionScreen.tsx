import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAllLesions } from "../../database/queries";
import ReportDisclaimerModal from "../../components/ReportDisclaimerModal";
import {
  generateAndShareReport,
  ReportLesion,
} from "../../services/pdfService";
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";

export default function ReportSelectionScreen() {
  const navigation = useNavigation<any>();
  const [lesions, setLesions] = useState<ReportLesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesion, setSelectedLesion] = useState<ReportLesion | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_400Regular,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllLesions();
      const filtered = data.filter(
        (item: any) => item.region && item.region !== "Unspecified"
      );
      setLesions(filtered as ReportLesion[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: ReportLesion) => {
    setSelectedLesion(item);
    setModalVisible(true);
  };

  const handleGenerate = async () => {
    if (!selectedLesion) return;
    setModalVisible(false); // Close modal first
    await generateAndShareReport(selectedLesion);
  };

  if (!fontsLoaded) return <View />;

  return (
    <View className="flex-1 bg-[#ffc0b5]">
      <ReportDisclaimerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleGenerate}
      />

      {/* Header */}
      <View className="pt-14 px-6 pb-6 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "Montserrat_700Bold" }}
          className="text-white text-2xl"
        >
          Select Lesion
        </Text>
      </View>

      {/* Content Sheet */}
      <View className="flex-1 bg-white rounded-t-[40px] overflow-hidden shadow-xl mt-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#fe948d" size="large" />
          </View>
        ) : lesions.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-400">No scans found.</Text>
          </View>
        ) : (
          <FlatList
            data={lesions}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, gap: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center"
                onPress={() => handleSelect(item)}
              >
                <Image
                  source={{ uri: item.imageUri }}
                  className="w-16 h-16 rounded-xl bg-gray-200"
                />
                <View className="ml-4 flex-1">
                  <Text
                    style={{ fontFamily: "Montserrat_600SemiBold" }}
                    className="text-[#5a3e3e] text-lg"
                  >
                    {item.region}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <Text
                    className={`text-xs mt-1 font-bold ${item.resultLabel === "Malignant" ? "text-red-500" : "text-green-600"}`}
                  >
                    {item.resultLabel}
                  </Text>
                </View>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="#fe948d"
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
