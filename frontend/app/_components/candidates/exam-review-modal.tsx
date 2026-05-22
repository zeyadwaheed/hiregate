"use client";

import { useDisableBodyScroll, restoreBodyScroll } from "@/app/_hooks/useDisableBodyScroll";
import { Loader } from "lucide-react";

type Choice = {
  id: number;
  text: string;
  isCorrect: boolean;
};

type Question = {
  questionId: number;
  questionText: string;
  questionImage: string | null;
  selectedChoiceId: number | null ;
  isCorrect: boolean;
  choices: Choice[];
};

type ExamReview = {
  candidateId: number;
  candidateName: string;
  finalScore: number;
  examName?: string;
  questions: Question[];
};

interface Props {
  data: ExamReview | null;
  loading: boolean;
  onClose: () => void;
}

export default function ExamReviewModal({
  data,
  loading,
  onClose,
}: Props) {
  useDisableBodyScroll(data !== null);
  //console.log("ExamReviewModal data:", data);
  if (!data) return null;

  const getChoiceClass = (choice: Choice, selectedId: number | null) => {
    const isSelected = choice.id === selectedId;

    if (choice.isCorrect) {
      return "bg-green-100 border border-green-400 text-green-800";
    }

    if (isSelected && !choice.isCorrect) {
      return "bg-red-100 border border-red-400 text-red-800";
    }

    return "bg-white border border-slate-200 text-slate-700";
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { restoreBodyScroll(); onClose(); }}>
      
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-300" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="p-6 border-b border-slate-300 flex justify-between items-center bg-slate-50">
          
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              Exam Review
            </h2>

            <div className="text-sm text-slate-500 space-y-1">
              <div>Candidate Name: {data.candidateName}</div>
              <div>Score: {data.finalScore}</div>
            </div>
          </div>

          <button
            onClick={() => { restoreBodyScroll(); onClose(); }}
            className="text-slate-500 text-xxl hover:text-slate-700"
          >
            X
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 overflow-y-auto space-y-6">

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader className="animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {(data.questions ?? []).map((q) => (
                <div
                  key={q.questionId}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm"
                >
                  {/* QUESTION */}
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-4">
                  <div className="w-full text-lg font-semibold text-slate-900">
                      {q.questionText}
                  </div>
                  {q.questionImage && (
                      <div className="flex justify-center w-full">
                        <img
                          src={q.questionImage}
                          alt="Question"
                          className="max-w-full h-auto rounded-lg border border-slate-300"
                        />
                      </div>
                  )}
                  </div>
                  </div>
                    {q.selectedChoiceId == null ? (
                      <span
                        className="shrink-0 text-xs font-medium text-amber-700"
                        title="No choice was selected"
                      >
                        No answer
                      </span>
                    ) : null}
                  </div>
                  {/* CHOICES */}
                  <div className="space-y-2">
                    {q.choices.map((c) => {
                      const isSelected = c.id === q.selectedChoiceId;

                      return (
                        <div
                          key={c.id}
                          className={`rounded-lg px-3 py-2 text-sm flex justify-between items-center ${getChoiceClass(
                            c,
                            q.selectedChoiceId
                          )}`}
                        >
                          <span>{c.text}</span>

                          {isSelected && (
                            <span
                              className={`text-xs font-semibold ${
                                q.isCorrect ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {q.isCorrect ? "Correct ✔" : "Incorrect ✖"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
