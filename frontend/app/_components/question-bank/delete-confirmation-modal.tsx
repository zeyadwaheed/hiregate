"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader, Trash2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  loading: boolean;
  title: string;
  description: string;
  itemLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}
export function DeleteConfirmationModal({
  isOpen,
  loading,
  title,
  description,
  itemLabel,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          {itemLabel ? <p className="text-sm text-gray-700 mb-6 line-clamp-2">{itemLabel}</p> : null}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { onCancel(); }}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); }}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
