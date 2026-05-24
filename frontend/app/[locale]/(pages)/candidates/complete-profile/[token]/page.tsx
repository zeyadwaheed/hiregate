"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  completeCandidateProfile,
  getExamPageData,
} from "@/app/_services/candidate-exam-service";

import { handleExamError } from "@/app/_utils/exam-error-handler";

export default function CompleteProfilePage() {
  const router = useRouter();
  const params = useParams();

  const token = params?.token as string;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(true);

  // ---------------- INITIAL CHECK ----------------
  useEffect(() => {
    const checkFlow = async () => {
      try {
        const res = await getExamPageData(token);
        const candidate = res.data;

        const isProfileCompleted =
          !!candidate?.firstName?.trim() &&
          !!candidate?.lastName?.trim() &&
          !!candidate?.phoneNumber?.toString().trim();

        if (isProfileCompleted) {
          router.replace(`/candidates/exam-page/${token}`);
          return;
        }

        setLoading(false);
      } catch (err: any) {
        const handled = handleExamError(err, router);
        if (handled) return;

        // ❌ DO NOT blindly redirect to thank-you
        setLoading(false);
      }
    };

    checkFlow();
  }, [token, router]);

  // ---------------- SUBMIT ----------------
  const handleContinue = async () => {
    try {
      await completeCandidateProfile(token, {
        FirstName: firstName,
        LastName: lastName,
        PhoneNumber: phoneNumber,
      });

      router.push(`/candidates/exam-page/${token}`);
    } catch (err: any) {
      const handled = handleExamError(err, router);
      if (handled) return;

      // only fallback for unknown errors
      console.error("Profile completion failed:", err);
    }
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        Loading...
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="logo" className="h-12 w-auto" />
        </div>

        {/* TITLE */}
        <h2 className="text-2xl font-bold mb-6">
          Complete Your Profile
        </h2>

        {/* FIRST NAME */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">First Name</label>
          <input
            className="w-full mt-1 p-3 border rounded-lg"
            placeholder="Enter first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* LAST NAME */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Last Name</label>
          <input
            className="w-full mt-1 p-3 border rounded-lg"
            placeholder="Enter last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* PHONE */}
        <div className="mb-6">
          <label className="text-sm text-gray-600">Phone Number</label>
          <input
            className="w-full mt-1 p-3 border rounded-lg"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}