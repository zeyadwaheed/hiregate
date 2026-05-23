"use client";

import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import DeleteExamButton from "@/app/_components/exams/delete-exam-button";
import { formatExamWindowTime } from "@/app/_lib/utils";
import type { ExamSummary } from "@/app/_lib/exams/exam.types";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type ExamCardProps = {
  exam: ExamSummary;
  onDeleted?: () => void;
};

export default function ExamCard({ exam, onDeleted }: ExamCardProps) {
  const router = useRouter();
  const t = useTranslations("Exams");
  const windowStartTime = formatExamWindowTime(exam.windowStartTime);
  const windowEndTime = formatExamWindowTime(exam.windowEndTime);

  return (
    <Card className="group relative overflow-hidden border-slate-200 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/70">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-transform duration-300 ease-out group-hover:scale-x-100" />

      <CardContent className="relative">
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-blue-700">
            {exam.positionTitle}
          </h3>
        </div>

        <div className="mb-4 space-y-3 text-sm text-slate-600 transition-colors duration-300 group-hover:text-slate-700">
          <p>{t("duration")}: {exam.durationMinutes} {t("minutes")}</p>
          <p>{t("questions")}: {exam.questionCount}</p>
          <p><strong>{t("start-time")}:</strong> {windowStartTime}</p>
          <p><strong>{t("end-time")}:</strong> {windowEndTime}</p>
        </div>

        <div className="flex gap-2 border-t border-slate-200 pt-4">
          <Button as="link" href={`/exams/${exam.id}`} variant="secondary" className="flex-1">
            {t("view")}
          </Button>
          <Button
            type="button"
            variant="soft"
            className="flex-1"
            onClick={() => router.push(`/exams/${exam.id}/edit`)}
          >
            {t("edit")}
          </Button>
          <DeleteExamButton examId={exam.id} className="flex-1" onDeleted={onDeleted} />
        </div>
      </CardContent>
    </Card>
  );
}
