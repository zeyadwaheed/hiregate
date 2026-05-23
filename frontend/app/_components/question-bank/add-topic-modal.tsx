"use client";

import { FormEvent } from "react";
import { Loader, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDisableBodyScroll, restoreBodyScroll } from "@/app/_hooks/useDisableBodyScroll";

interface AddTopicModalProps {
  isOpen: boolean;
  loading: boolean;
  topicName: string;
  topicError: string | null;
  isEditing?: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onTopicNameChange: (value: string) => void;
}


export function AddTopicModal({
  isOpen,
  loading,
  topicName,
  topicError,
  isEditing = false,
  onClose,
  onSubmit,
  onTopicNameChange,
}: AddTopicModalProps) {
  const t = useTranslations("Add-topics");

  useDisableBodyScroll(isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { restoreBodyScroll(); onClose(); }}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {isEditing ? "Edit Topic" : t("add-topic")}
          </h3>
          <button
            onClick={() => { restoreBodyScroll(); onClose(); }}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close add topic modal"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("topic-name")}</label>
            <input
              type="text"
              value={topicName}
              onChange={(event) => onTopicNameChange(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
              placeholder="Enter a topic name"
              required
              autoFocus
            />
          </div>

          {topicError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {topicError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => { restoreBodyScroll(); onClose(); }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {isEditing ? "Save Topic" : t("add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
