import React, { createContext, useContext, useState } from "react";

// 1. Define the shape of your Auth data
interface AuthContextType {
  user: any;
  loading: boolean;
  setUser: (user: any) => void;
}

// 2. Create the Context with a SAFE default value (Not null!)
const AuthContext = createContext<AuthContextType>({
  user: null,        // Default: No user logged in
  loading: false,    // Default: Not loading
  setUser: () => {}, // Default: Empty function that does nothing
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Simulating a "Guest" user for now so you can see the Home screen immediately
  const [user, setUser] = useState<any>(null); // Start as null (logged out)
  const [loading, setLoading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}