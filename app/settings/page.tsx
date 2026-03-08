"use client";

import ApiKeyForm from "@/components/settings/ApiKeyForm";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">設定</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          アプリケーションの設定を管理します
        </p>
      </div>

      <ApiKeyForm />

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p className="text-xs text-slate-500 leading-relaxed">
          APIキーはブラウザのセッション中のみ保持され、タブを閉じると自動的に削除されます。
          外部への転送は行いません。
        </p>
      </div>
    </div>
  );
}
