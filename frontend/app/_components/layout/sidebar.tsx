"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserFromToken } from "@/app/_lib/auth";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const navItems: NavItem[] = [
  { href: "/exams", label: "Exams", description: "Manage assessments" },
  { href: "/question-bank", label: "Question Bank", description: "MCQ library" },
  { href: "/candidates", label: "Candidates", description: "Submissions and status" },
  { href: "/admins", label: "Admins", description: "Owner HR management" },
  { href: "/topics", label: "Topics", description: "Topic management" },
];

export default function Sidebar() {
  const router = useRouter();
  const user = getUserFromToken();

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky inset-y-0 left-0 z-50
        flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="border-b border-slate-200 px-6 py-6">
          <p className="text-2xl font-bold text-blue-600">HireGate</p>
          <p className="mt-1 text-sm text-slate-500">HR Exam Platform</p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
  {navItems
  .filter((item) => {
    if (item.href === "/admins" && user?.role !== "CEO") {
      return false;
    }
    return true;
  })
  .map((item) => {
      const isActive =
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`);

      return (
        <Link
          key={item.href}
          href={item.href}
                onClick={() => setIsOpen(false)}
          className={[
            "block rounded-lg px-4 py-3 transition-colors",
            isActive
            ? "bg-blue-50 text-blue-600"
            : "text-slate-700 hover:bg-slate-50",
          ].join(" ")}
        >
          <p
            className={[
              "text-base font-medium",
              isActive ? "text-blue-600" : "text-slate-900",
            ].join(" ")}
          >
            {item.label}
          </p>
          <p className="mt-1 text-xs text-slate-500">
          {item.description}
        </p>
        </Link>
      );
    })}
  
      </nav>

        <div className="mt-auto shrink-0 border-t border-slate-200 bg-slate-50/40 px-4 pb-6 pt-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              HG
            </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">HireGate Team</p>
              <p className="text-xs text-slate-500">Internal dashboard</p>
            </div>
          </div>
  
      <button
              type="button"
        onClick={logout}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 cursor-pointer"
            >
              <LogOut
                size={18}
                strokeWidth={2}
                className="shrink-0 text-slate-500 transition-colors group-hover:text-red-600"
                aria-hidden
              />
              Log out
      </button>
          </div>
      </div>
      </aside>
    </>
  );
}
