import React, { createContext, useContext, useState } from "react";

// Define the shape of the data
interface SurveyData {
  age: string;
  gender: string;
  skinType: string;
  familyHistory: string;
  sunExposure: string;
  sunscreenUsage: string;
  moleChanges: string;
  tanningBedUsage: string;
}

interface SurveyContextType {
  surveyData: SurveyData;
  setSurveyData: React.Dispatch<React.SetStateAction<SurveyData>>;
}

const defaultData: SurveyData = {
  age: "",
  gender: "",
  skinType: "",
  familyHistory: "",
  sunExposure: "",
  sunscreenUsage: "",
  moleChanges: "",
  tanningBedUsage: "",
};

const SurveyContext = createContext<SurveyContextType>({
  surveyData: defaultData,
  setSurveyData: () => {},
});

export const useSurvey = () => useContext(SurveyContext);

export const SurveyProvider = ({ children }: { children: React.ReactNode }) => {
  const [surveyData, setSurveyData] = useState<SurveyData>(defaultData);

  return (
    <SurveyContext.Provider value={{ surveyData, setSurveyData }}>
      {children}
    </SurveyContext.Provider>
  );
};