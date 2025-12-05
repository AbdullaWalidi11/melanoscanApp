import React, { useRef, useState, useEffect } from "react";
import {
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Text, TextInput, TouchableOpacity, View, ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, Send } from "lucide-react-native";
import Markdown from "react-native-markdown-display";

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

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const chatSession = useRef<any>(null);

  // 1. INITIALIZATION: Build Context & Start Session
  useEffect(() => {
    const initChat = async () => {
      try {
        const context = await generateContextPrompt(lesionId);
        
        if (!context) {
          setMessages([{ id: "err", role: "model", text: "Error loading scan data." }]);
          setIsLoading(false);
          return;
        }

        // --- FETCH SAVED HISTORY FROM DB ---
        const db = (require('../database/db').getDB()); 
        const row = await db.getFirstAsync('SELECT chatHistory FROM lesions WHERE id = ?', [lesionId]);
        
        let savedMessages: Message[] = [];
        if (row?.chatHistory) {
            try {
                savedMessages = JSON.parse(row.chatHistory);
            } catch (e) { console.error("Parse error", e); }
        }

        // --- PREPARE AI ---
        // Use 2.0-flash or 1.5-flash depending on your key access
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        // --- CONSTRUCT HISTORY FOR STABLE SDK ---
        // Format: { role: 'user' | 'model', parts: [{ text: string }, { inlineData: ... }] }
        const historyForSDK = [
          {
            role: "user",
            parts: [{ text: context.systemInstruction }],
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
                    mimeType: "image/jpeg"
                }
            } as any);
        }

        // Inject Previous Chat History
        if (savedMessages.length > 0) {
            const formattedHistory = savedMessages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));
            historyForSDK.push(...formattedHistory);
        }

        // Start Chat Session
        chatSession.current = model.startChat({ history: historyForSDK });

        // --- RESTORE UI ---
        if (savedMessages.length > 0) {
            setMessages(savedMessages);
        } else {
            setMessages([{ 
                id: "welcome", 
                role: "model", 
                text: "Hello. I've reviewed your scan and risk profile. How can I help?" 
            }]);
        }

      } catch (e) {
        console.error("Chat Init Error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (lesionId) initChat();
  }, [lesionId]);

  // 2. SEND MESSAGE LOGIC
  const sendMessage = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userText = input.trim();
    setInput("");

    // Optimistic UI Update
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: userText };
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
        text: responseText 
      };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // ✅ SAVE HISTORY TO DB
      await saveChatHistory(lesionId, finalMessages);

    } catch (error) {
      console.error("Send error:", error);
      setMessages((prev) => [...prev, { id: "err", role: "model", text: "Connection error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View className="flex-1 bg-white pt-12">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="flex-row justify-between items-center p-4 bg-[#FF9B9B] rounded-b-3xl shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
           <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <View>
            <Text className="text-white text-xl font-bold text-center">AI Assistant</Text>
            <Text className="text-white/80 text-xs text-center font-medium">Context Active</Text>
        </View>
        <View style={{ width: 28 }} /> 
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {isLoading ? (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#FF9B9B" />
                <Text className="text-gray-400 mt-4">Analyzing...</Text>
            </View>
        ) : (
            <ScrollView
                className="flex-1 px-4 pt-4"
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
            {messages.map((msg) => (
                <View key={msg.id} className={`flex-row my-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <View className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${msg.role === "user" ? "bg-white border border-gray-100 rounded-tr-none" : "bg-[#FF9B9B] rounded-tl-none"}`}>
                    {msg.role === "user" ? (
                        <Text className="text-base text-gray-800">{msg.text}</Text>
                    ) : (
                        <Markdown style={{ body: { color: 'white', fontSize: 16 }, strong: { fontWeight: 'bold', color: 'white' } }}>
                            {msg.text}
                        </Markdown>
                    )}
                </View>
                </View>
            ))}
            {isTyping && <Text className="text-gray-400 ml-4 mb-2 italic">Thinking...</Text>}
            </ScrollView>
        )}

        {/* Input Area */}
        <View className="p-4 bg-[#FF9B9B] rounded-t-3xl">
          <View className="flex-row items-center bg-white rounded-full px-2 py-1 shadow-md">
            <TextInput
              className="flex-1 px-4 py-3 text-gray-700 text-base"
              placeholder="Ask away..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity onPress={sendMessage} disabled={!input.trim() || isTyping} className={`p-3 rounded-full m-1 ${input.trim() ? "bg-[#FF6B6B]" : "bg-gray-300"}`}>
               <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;