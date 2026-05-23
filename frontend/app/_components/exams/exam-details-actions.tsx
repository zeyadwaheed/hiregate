"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import DeleteExamButton from "@/app/_components/exams/delete-exam-button";
import { useTranslations } from "next-intl";

type ExamDetailsActionsProps = {
  examId: number;
};

export default function ExamDetailsActions({ examId }: ExamDetailsActionsProps) {
  const router = useRouter();
  const t = useTranslations("Exams");

  return (
    <div className="flex gap-3">
      <Button type="button" variant="soft" onClick={() => router.push(`/exams/${examId}/edit`)}>
        {t("edit-exam")}
      </Button>
      <DeleteExamButton examId={examId} redirectTo="/exams" />
    </div>
  );
}
