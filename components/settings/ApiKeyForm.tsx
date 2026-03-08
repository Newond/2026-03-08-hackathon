"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, Key } from "lucide-react";
import { useApiKey } from "@/lib/api-key-context";
import { Card, CardContent } from "@/components/ui/Card";

export default function ApiKeyForm() {
  const { apiKey, setApiKey, isKeySet } = useApiKey();
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(inputValue.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setApiKey("");
    setInputValue("");
    setSaved(false);
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
            <Key className="w-4.5 h-4.5 text-sky-500" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Anthropic API Key
            </p>
            <p className="text-xs text-slate-400">
              Stored for this session only
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setSaved(false);
              }}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!inputValue.trim() || inputValue.trim() === apiKey}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saved ? "Saved" : "Save"}
            </button>
            {isKeySet && (
              <button
                onClick={handleClear}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {isKeySet && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              API key is configured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
