"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import type { BackendQuestionDto } from "@/app/_lib/exams/exam.types";
import { useTranslations } from "next-intl";

type ExamQuestionsManagerProps = {
  initialQuestions: BackendQuestionDto[];
};

export default function ExamQuestionsManager({
  initialQuestions,
}: ExamQuestionsManagerProps) {
  const [openQuestionIds, setOpenQuestionIds] = useState<number[]>([]);
  const t = useTranslations("Exams");

  function toggleChoices(questionId: number) {
    setOpenQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("exam-questions")}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {t("review-questions")}
          </p>
        </div>

        {initialQuestions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            {t("no-attached-questions")}
          </div>
        ) : (
          <div className="space-y-3">
            {initialQuestions.map((question) => (
              <div
                key={question.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      #{question.id} {question.questionText}
                    </p>
                    <br />
                    {question.questionImage && (
                    <img
                      src={question.questionImage}
                      alt="Question visual"
                      className="w-60h-40 sm:w-40sm:h-40 oject-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                  )}
                    <p className="mt-1 text-xs text-slate-500">
                      {t("topic")}: {question.topicName || t("uncategorized")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => toggleChoices(question.id)}
                    aria-label={
                      openQuestionIds.includes(question.id)
                        ? `Hide choices for question ${question.id}`
                        : `View choices for question ${question.id}`
                    }
                  >
                    {openQuestionIds.includes(question.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    {openQuestionIds.includes(question.id) ? t("hide-choices") : t("view-choices")}
                  </Button>
                </div>

                {openQuestionIds.includes(question.id) ? (
                  <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("choices")}
                    </p>
                    {question.choices.length === 0 ? (
                      <p className="text-sm text-slate-500">{t("no-choices")}</p>
                    ) : (
                      <div className="space-y-2">
                        {question.choices.map((choice) => (
                          <div
                            key={choice.id}
                            className={`rounded-lg border px-3 py-2 text-sm ${choice.isCorrect
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-white text-slate-700"
                              }`}
                          >
                            {choice.choiceText}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
