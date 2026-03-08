"use client";

import ApiKeyForm from "@/components/settings/ApiKeyForm";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage application settings
        </p>
      </div>

      <ApiKeyForm />

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p className="text-xs text-slate-500 leading-relaxed">
          Your API key is stored only for the current browser session and is
          automatically deleted when you close the tab. It is never transmitted
          externally.
        </p>
      </div>
    </div>
  );
}
