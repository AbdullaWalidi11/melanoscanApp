import React, { createContext, useContext, useState } from "react";

// 1. Define the shape of the data
export interface SurveyData {
  // --- Page 1: Basics ---
  age: string;
  gender: string;
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  sunReaction: string;
  freckling: string;
  workEnvironment: string;
  climate: string;
  ancestry: string;

  // --- Page 2: History & Habits ---
  personalHistory: string;
  familyHistory: string;
  childhoodSunburns: string;
  tanningBeds: string;
  moleCount: string;
  uglyDuckling: string;
  recentChanges: string;
  sunscreen: string;
  protection: string;
  checkups: string;
}

// 2. Define the Context Type
interface SurveyContextType {
  surveyData: SurveyData;
  setSurveyData: React.Dispatch<React.SetStateAction<SurveyData>>;
}

// 3. Initialize Default Values (Empty Strings)
const defaultData: SurveyData = {
  // Page 1
  age: "",
  gender: "",
  hairColor: "",
  eyeColor: "",
  skinTone: "",
  sunReaction: "",
  freckling: "",
  workEnvironment: "",
  climate: "",
  ancestry: "",

  // Page 2
  personalHistory: "",
  familyHistory: "",
  childhoodSunburns: "",
  tanningBeds: "",
  moleCount: "",
  uglyDuckling: "",
  recentChanges: "",
  sunscreen: "",
  protection: "",
  checkups: "",
};

// 4. Create the Context
const SurveyContext = createContext<SurveyContextType>({
  surveyData: defaultData,
  setSurveyData: () => {},
});

// 5. Custom Hook for easy access
export const useSurvey = () => useContext(SurveyContext);

// 6. The Provider Component
export const SurveyProvider = ({ children }: { children: React.ReactNode }) => {
  const [surveyData, setSurveyData] = useState<SurveyData>(defaultData);

  return (
    <SurveyContext.Provider value={{ surveyData, setSurveyData }}>
      {children}
    </SurveyContext.Provider>
  );
};