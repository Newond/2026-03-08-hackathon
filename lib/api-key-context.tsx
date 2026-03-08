"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  isKeySet: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType>({
  apiKey: "",
  setApiKey: () => {},
  isKeySet: false,
});

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState("");

  // sessionStorage から復元（タブを閉じるまで保持）
  useEffect(() => {
    const stored = sessionStorage.getItem("anthropic-api-key");
    if (stored) setApiKeyState(stored);
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (key) {
      sessionStorage.setItem("anthropic-api-key", key);
    } else {
      sessionStorage.removeItem("anthropic-api-key");
    }
  }, []);

  return (
    <ApiKeyContext.Provider
      value={{ apiKey, setApiKey, isKeySet: apiKey.length > 0 }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  return useContext(ApiKeyContext);
}
