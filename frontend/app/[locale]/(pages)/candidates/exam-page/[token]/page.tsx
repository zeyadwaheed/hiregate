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

        // SUBMITTED USERS → redirect immediately
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

  if (diff <= 0) return "00:00:00 ";

  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const timePart = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  if (days >= 1) {
    return `${days} day${days > 1 ? "s" : ""} ${timePart} `;
  }

  return `${timePart} `;
};

const formatTimeLeft = (diffMs: number) => {
  if (diffMs <= 0) return "0 seconds";

  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 24h or more → days format
  if (days >= 1) {
    if (hours > 0) {
      return `${days} day${days > 1 ? "s" : ""} ${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${days} day${days > 1 ? "s" : ""}`;
  }

  // less than 24h → human format
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return `${seconds} second${seconds !== 1 ? "s" : ""}`;
};

// ---------------- TIMER SOURCE ----------------

let timerValue = "00:00:00";

if (isUpcoming) {
  timerValue = getTimeLeft(start);   // countdown until exam opens
} else if (isOpen) {
  timerValue = getTimeLeft(end);     // countdown until exam closes
} else {
  timerValue = "00:00:00";
}

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
<div>
  The exam status is{" "}
  <span className="font-semibold">
    {isOpen ? "open" : isUpcoming ? "upcoming" : "closed"}
  </span>
  {isOpen && (
    <>
      {" "}
      and will close in{" "}
      <span className="font-semibold text-green-600">
        {timerValue}
      </span>

    </>
  )}
  {isUpcoming && (
    <>
     {" "}
     and will open in  {" "}
      <span className="font-semibold text-red-600">
        {timerValue}
      </span>

</>
)}
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

          </div>
          <br />
            {/* Guidelines */}
            <div>
          
          <div className="text-sm text-gray-600 leading-6 space-y-4">
          <span className="font-medium">Exam guidelines:</span>
          <br/>
              • You can start the exam whenever you are ready within the allowed period
              <br />
              • Please ensure stable internet connection throughout the exam
              <br />
              • Once submitted, the exam cannot be retaken
              <br />
              • For support: support@eozom.com
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