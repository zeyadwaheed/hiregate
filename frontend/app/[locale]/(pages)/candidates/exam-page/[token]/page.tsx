"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getExamPageData } from "@/app/_services/candidate-exam-service";
import { handleExamError } from "@/app/_utils/exam-error-handler";

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [now, setNow] = useState(new Date());

  // ---------------- FETCH ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const exam = await getExamPageData(token);
        const data = exam?.data;

        // 🚨 SUBMITTED USERS → redirect immediately
        if (data?.windowStatus === "submitted") {
          router.replace("/candidates/thank-you");
          return;
        }

        setExamData(data);
      } catch (err: any) {
        const handled = handleExamError(err, router);
        if (handled) return;
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, router]);

  // ---------------- LIVE TIMER ----------------
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading exam information...
      </div>
    );
  }

  // ---------------- SAFETY CHECK ----------------
  if (!examData) {
    return (
      <div className="p-10 text-center text-red-500">
        Unable to load exam data
      </div>
    );
  }

  // ---------------- WINDOW STATUS ----------------
  const windowStatus = examData.windowStatus;

  const isOpen = windowStatus === "open";
  const isUpcoming = windowStatus === "upcoming";
  const isClosed = windowStatus === "closed";

  const start = new Date(examData.windowStartTime);
  const end = new Date(examData.windowEndTime);

  // ---------------- TIMER ----------------
  const getTimeLeft = (target: Date) => {
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return "00:00:00";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  let timerValue = "00:00:00";

  if (isUpcoming) timerValue = getTimeLeft(start);
  else if (isOpen) timerValue = getTimeLeft(end);
  else if (isClosed) timerValue = "00:00:00";

  // ---------------- START EXAM ----------------
  const handleStartExam = () => {
    if (!isOpen) return;
    router.push(`/candidates/start-exam/${token}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow text-center">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="logo" className="h-12 w-auto" />
        </div>

        {/* TIMER */}
        <div
          className={`text-center font-bold text-lg mb-4 ${
            isOpen ? "text-green-600" : "text-red-600"
          }`}
        >
          {timerValue}
        </div>

        {/* TITLE */}
        <div className="mb-6 text-left">
          <p className="mt-2 text-gray-700">
            We are pleased to invite you to the{" "}
            <span className="font-semibold">
              {examData?.examTitle ?? "—"}
            </span>{" "}
            exam.
          </p>

          <p className="mt-2 text-gray-700">
            Please review the instructions below before starting the exam.
          </p>
        </div>

        {/* INFO */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left border-2 border-gray-300">

          <h2 className="font-semibold mb-4 text-center text-base">
            Exam Instructions
          </h2>

          <div className="text-sm text-gray-600 leading-6 space-y-4">

            <div>
              <span className="font-medium">Exam duration and schedule:</span>
              <br />
              • {examData?.durationMinutes ?? "—"} minutes
              <br />
              • From {start.toLocaleString()} till {end.toLocaleString()}
              <br />
              • {examData?.questionCount ?? "—"} MCQ Questions
            </div>

            <div>
              <span className="font-medium">Status:</span>
              <br />
              • {windowStatus}
            </div>

          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleStartExam}
          disabled={!isOpen}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isOpen
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-400 text-white cursor-not-allowed"
          }`}
        >
          Start Exam
        </button>

      </div>
    </div>
  );
}