"use client";

import { Clock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { startExam, submitExam } from "@/app/_services/candidate-exam-service";
import { handleExamError } from "@/app/_utils/exam-error-handler";

export default function StartExamPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [warning, setWarning] = useState("");

  const STORAGE_KEY = `exam_answers_${token}`;

  // ---------------- LOAD SAVED ANSWERS ----------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAnswers(JSON.parse(saved));
  }, []);

  // ---------------- FETCH EXAM ----------------
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await startExam(token);

        if (!res || res.success === false || !res.data) {
          throw new Error(res?.message || "Exam not available");
        }

        setExam(res.data);
      } catch (err: any) {
        const handled = handleExamError(err, router);
        if (handled) return;

        setWarning("Failed to load exam.");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [token]);

  // ---------------- TIMER ----------------
  useEffect(() => {
    if (!exam?.startedAt || !exam?.durationMinutes) return;

    const start = new Date(exam.startedAt).getTime();
    const end = start + exam.durationMinutes * 60 * 1000;

    const interval = setInterval(() => {
      const diff = end - Date.now();

      setTimeLeft(diff > 0 ? diff : 0);

      if (diff <= 0 && !submitted) {
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [exam, submitted]);

  // ---------------- SELECT ANSWER ----------------
  const handleSelect = (qId: number, cId: number) => {
    if (submitted) return;

    const updated = { ...answers, [qId]: cId };
    setAnswers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (auto = false) => {
    if (submitted || submitting) return;

    try {
      setSubmitting(true);
      setWarning("");

      const payload = {
        answers: Object.entries(answers).map(([qId, cId]) => ({
          questionId: Number(qId),
          choiceId: Number(cId),
        })),
      };

      await submitExam(token, payload);

      setSubmitted(true);
      localStorage.removeItem(STORAGE_KEY);

      router.push("/candidates/thank-you");
    } catch (err: any) {
      const handled = handleExamError(err, router);
      if (handled) return;

      setWarning(err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return <div className="p-10 text-center">Loading exam...</div>;
  }

  if (!exam) return null;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam.questions?.length || 0;
  const progress = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {exam.positionTitle || "Exam"}
          </h1>

          <div className="flex items-center gap-2 text-red-600 font-bold">
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mb-6">
          <p className="text-sm mb-1">
            {answeredCount}/{totalQuestions} answered
          </p>

          <div className="h-3 bg-slate-200 rounded">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* QUESTIONS */}
        {exam.questions?.map((q: any, i: number) => (
          <div key={q.id} className="mb-6 border p-4 rounded-lg">
            <p className="font-semibold mb-3">
              Q{i + 1}. {q.questionText}
            </p>

            {q.choices?.map((c: any) => (
              <button
                key={c.id}
                onClick={() => handleSelect(q.id, c.id)}
                disabled={submitted}
                className={`w-full text-left p-3 border rounded mb-2 ${
                  answers[q.id] === c.id
                    ? "bg-slate-100"
                    : "bg-white hover:bg-slate-50"
                }`}
              >
                {c.text}
              </button>
            ))}
          </div>
        ))}

        {/* WARNING */}
        {warning && (
          <div className="mb-4 text-red-600">{warning}</div>
        )}

        {/* SUBMIT */}
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting || submitted}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          {submitted ? "Submitted" : submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}