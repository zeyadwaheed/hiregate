  "use client";
import { FormEvent } from "react"
import { X } from "lucide-react";
import Input from "@/app/_components/ui/input";
import { UserRole } from "@/app/_lib/admin.types";
import { useDisableBodyScroll, restoreBodyScroll } from "@/app/_hooks/useDisableBodyScroll";

interface CreateAdminModalProps {
  isOpen: boolean;
  submitting: boolean;
  email: string;
  role: UserRole;
  roleOptions: UserRole[];
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: UserRole) => void;
}

export function CreateAdminModal({
  isOpen,
  submitting,
  email,
  role,
  roleOptions,
  error,
  onClose,
  onSubmit,
  onEmailChange,
  onRoleChange,
}: CreateAdminModalProps) {
  useDisableBodyScroll(isOpen);

  useDisableBodyScroll(isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { restoreBodyScroll(); onClose(); }}>
      <div className="bg-white rounded-xl p-6 max-w-xl w-full shadow-xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Create Admin</h3>
          <button
            onClick={() => { restoreBodyScroll(); onClose(); }}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close create admin modal"
          >
            <X size={22} />
          </button>
        </div>

        <form className="grid gap-3 sm:gap-4" onSubmit={onSubmit}>
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@hiregate.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            disabled={submitting}
          />

          <select
            id="admin-role"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500 cursor-pointer"
            value={role}
            onChange={(event) => onRoleChange(event.target.value as UserRole)}
            disabled={submitting}
          >
            {roleOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => { restoreBodyScroll(); onClose(); }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
