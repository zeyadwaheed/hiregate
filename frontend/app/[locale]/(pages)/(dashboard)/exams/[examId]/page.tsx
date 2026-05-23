"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/app/_components/layout/header";
import { Card, CardContent } from "@/app/_components/ui/card";
import ExamQuestionsManager from "@/app/_components/exams/exam-questions-manager";
import { getExamById } from "@/app/_services/exam-service";
import { formatExamWindowTime } from "@/app/_lib/utils";
import ExamDetailsActions from "@/app/_components/exams/exam-details-actions";
import type { Exam } from "@/app/_lib/exams/exam.types";
import { ExamApiError } from "@/app/_lib/errorHandling";
import { useTranslations } from "next-intl";

export default function ExamDetailsPage() {
  const params = useParams<{ examId: string }>();
  const router = useRouter();
  const t = useTranslations("Exams");
  const examId = Number(params.examId);

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExam() {
      if (Number.isNaN(examId)) {
        setErrorMessage(t("invalid-exam-id"));
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const result = await getExamById(examId);
        setExam(result);
      } catch (error) {
        if (error instanceof ExamApiError && error.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : t("failed-load-exam"),
        );
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [examId, router]);

  if (loading) {
    return (
      <section className="space-y-6">
        <Header title={t("exam-details")} description={t("loading-exam-details")} />
      </section>
    );
  }

  if (errorMessage || !exam) {
    return (
      <section className="space-y-6">
        <Header title={t("exam-details")} description={t("could-not-load-exam")} />
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage ?? t("exam-not-found")}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Header
        title={exam.title}
        description={exam.description}
        action={<ExamDetailsActions examId={examId} />}
      />

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("duration")}</p>
            <p className="mt-1 text-sm text-slate-900">{exam.duration}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("question-count")}</p>
            <p className="mt-1 text-sm text-slate-900">{exam.questionCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("window-start")}</p>
            <p className="mt-1 text-sm text-slate-900">{formatExamWindowTime(exam.windowStartTime)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("window-end")}</p>
            <p className="mt-1 text-sm text-slate-900">{formatExamWindowTime(exam.windowEndTime)}</p>
          </div>
        </CardContent>
      </Card>

      <ExamQuestionsManager initialQuestions={exam.questions} />
    </section>
  );
}
