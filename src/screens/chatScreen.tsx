import React, { useRef, useState, useEffect } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, Send } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Markdown from "react-native-markdown-display";
import { useTranslation } from "react-i18next";

// ✅ STABLE SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

// Database
import { saveChatHistory } from "../database/queries";
import { generateContextPrompt } from "../services/contextAggregator";

// Initialize AI Client
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { lesionId } = route.params || {};
  const { t, i18n } = useTranslation();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0); // MANUAL KEYBOARD STATE

  const scrollViewRef = useRef<ScrollView>(null);
  const chatSession = useRef<any>(null);

  // MANUAL KEYBOARD LISTENER (Robust Fallback)
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardOffset(e.endCoordinates.height);
      // Scroll to bottom when keyboard opens
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  // 1. INITIALIZATION: Build Context & Start Session
  useEffect(() => {
    const initChat = async () => {
      try {
        const context = await generateContextPrompt(lesionId);

        if (!context) {
          setMessages([
            { id: "err", role: "model", text: t("chat.error_loading") },
          ]);
          setIsLoading(false);
          return;
        }

        // --- FETCH SAVED HISTORY FROM DB ---
        const db = require("../database/db").getDB();
        const row = await db.getFirstAsync(
          "SELECT chatHistory FROM lesions WHERE id = ?",
          [lesionId]
        );

        let savedMessages: Message[] = [];
        if (row?.chatHistory) {
          try {
            savedMessages = JSON.parse(row.chatHistory);
          } catch (e) {
            console.error("Parse error", e);
          }
        }

        // --- PREPARE AI ---
        // Use 2.0-flash or 1.5-flash depending on your key access
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // --- CONSTRUCT HISTORY FOR STABLE SDK ---
        // Format: { role: 'user' | 'model', parts: [{ text: string }, { inlineData: ... }] }
        // ✅ INJECT LANGUAGE CONTEXT
        const languageInstruction = `\n\nIMPORTANT: Respond to the user in ${i18n.language === "tr" ? "Turkish" : "English"}.`;

        const historyForSDK = [
          {
            role: "user",
            parts: [{ text: context.systemInstruction + languageInstruction }],
          },
          {
            role: "model",
            parts: [{ text: "I have reviewed the scan and patient history." }],
          },
        ];

        // Inject Image (if exists) into the first user message
        if (context.base64Image) {
          historyForSDK[0].parts.push({
            inlineData: {
              data: context.base64Image,
              mimeType: "image/jpeg",
            },
          } as any);
        }

        // Inject Previous Chat History
        if (savedMessages.length > 0) {
          const formattedHistory = savedMessages.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.text }],
          }));
          historyForSDK.push(...formattedHistory);
        }

        // Start Chat Session
        chatSession.current = model.startChat({ history: historyForSDK });

        // --- RESTORE UI ---
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          setMessages([
            {
              id: "welcome",
              role: "model",
              text: t("chat.initial_greeting"),
            },
          ]);
        }
      } catch (e) {
        console.error("Chat Init Error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (lesionId) initChat();
  }, [lesionId, i18n.language]);

  // 2. SEND MESSAGE LOGIC
  const sendMessage = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userText = input.trim();
    setInput("");

    // Optimistic UI Update
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: userText,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Send to Gemini
      const result = await chatSession.current.sendMessage(userText);
      const responseText = result.response.text();

      // Update UI with Response
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: responseText,
      };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // ✅ SAVE HISTORY TO DB
      await saveChatHistory(lesionId, finalMessages);
    } catch (error) {
      console.error("Send error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: "err",
          role: "model",
          text: t("chat.connection_error"),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    // 1. Base Background with Pink/Coral Color
    <View className="flex-1 bg-[#ffc0b5] relative overflow-hidden">
      <StatusBar barStyle="light-content" />

      {/* === TOP HEADER === */}
      <View className="absolute top-12 left-0 right-0 z-50 px-6 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft color="white" size={32} />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold tracking-widest relative bottom-1">
          {t("chat.title")}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* === BACKGROUND GEOMETRY === */}
      {/* ... (Geometry Views remain same) ... */}
      <View className="absolute inset-0 transform -translate-x-80 -translate-y-16 rotate-45 -z-20 opacity-80">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>
      <View className="absolute inset-0 transform -translate-x-[400px] -translate-y-10 rotate-45 -z-10">
        <View className="w-[600px] h-[600px]">
          <LinearGradient
            colors={["#fe948d", "#ff9da1", "#fe8d93"]}
            locations={[0, 0.38, 1]}
            className="w-full h-full"
          />
        </View>
      </View>

      {/* === MAIN CONTENT (White Sheet) === */}
      <View
        className="flex-1 mt-28 mb-0"
        style={{ paddingBottom: Platform.OS === "android" ? 0 : 0 }}
      >
        <View className="flex-1 bg-white rounded-t-[40px] overflow-hidden shadow-black shadow-3xl">
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#fe948d" />
              <Text className="text-gray-400 mt-4">{t("chat.analyzing")}</Text>
            </View>
          ) : (
            <ScrollView
              className="flex-1 px-5 pt-8"
              ref={scrollViewRef}
              onContentSizeChange={() =>
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  className={`flex-row my-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <View
                    className={`px-5 py-3 rounded-3xl max-w-[85%] shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#fe948d] rounded-tr-none"
                        : "bg-white border border-gray-100 rounded-tl-none"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <Text className="text-base text-white font-medium">
                        {msg.text}
                      </Text>
                    ) : (
                      <Markdown
                        style={{
                          body: { color: "#4a4a4a", fontSize: 16 },
                          strong: { fontWeight: "bold", color: "#333" },
                        }}
                      >
                        {msg.text}
                      </Markdown>
                    )}
                  </View>
                </View>
              ))}
              {isTyping && (
                <Text className="text-gray-400 ml-4 mb-2 italic">
                  {t("chat.thinking")}
                </Text>
              )}
            </ScrollView>
          )}

          {/* Input Area */}
          <View
            className="p-4 bg-[#fe948d] border-t border-gray-50"
            style={{
              marginBottom: Platform.OS === "ios" ? keyboardOffset : 0,
            }}
          >
            <View
              style={{
                marginBottom: Platform.OS === "android" ? keyboardOffset : 0,
              }}
            >
              <View className="flex-row items-center border border-gray-200 rounded-full px-2 py-1 mb-4 shadow-sm bg-gray-50">
                <TextInput
                  className="flex-1 px-4 py-3 text-gray-700 text-base"
                  placeholder={t("chat.placeholder")}
                  placeholderTextColor="#9CA3AF"
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className={`p-3 rounded-full m-1 ${
                    input.trim() ? "bg-[#fe948d]" : "bg-[#fe948d] opacity-50"
                  }`}
                >
                  <Send size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChatScreen;
