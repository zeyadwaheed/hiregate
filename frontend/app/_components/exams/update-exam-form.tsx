"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import ExamQuestionPicker from "@/app/_components/exams/exam-question-picker";
import ExamTopicRulesEditor from "@/app/_components/exams/exam-topic-rules-editor";
import { updateExam } from "@/app/_services/exam-service";
import type { Exam, ExamMode, ExamTopicRule } from "@/app/_lib/exams/exam.types";
import type { ExamFormState } from "@/app/_lib/exams/exam-form.types";
import { useTranslations } from "next-intl";

type ExamFormProps = {
  exam: Exam;
};

function toDateTimeLocalValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function UpdateExamForm({ exam }: ExamFormProps) {
  const router = useRouter();
  const t = useTranslations("Exams");
  const initialQuestionIds = useMemo(() => exam.questionIds ?? [], [exam.questionIds]);

  const [formState, setFormState] = useState<ExamFormState>({
    positionTitle: exam.title,
    durationMinutes: exam.durationMinutes?.toString() ?? "",
    windowStartTime: toDateTimeLocalValue(exam.windowStartTime),
    windowEndTime: toDateTimeLocalValue(exam.windowEndTime),
  });
  const [examMode, setExamMode] = useState<ExamMode>(exam.mode);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>(initialQuestionIds);
  const [topicRules, setTopicRules] = useState<ExamTopicRule[]>(exam.topicRules);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function usesQuestions(mode: ExamMode) {
    return mode === "static" || mode === "hybrid";
  }

  function usesTopicRules(mode: ExamMode) {
    return mode === "dynamic" || mode === "hybrid";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const uniqueIds = Array.from(new Set(selectedQuestionIds));
    const normalizedTopicRules = topicRules.map((rule) => ({
      topicId: rule.topicId,
      questionCount: rule.questionCount,
    }));

    if (usesQuestions(examMode) && uniqueIds.length === 0) {
      setIsSubmitting(false);
      setErrorMessage("Select at least one question.");
      return;
    }

    if (usesTopicRules(examMode) && normalizedTopicRules.length === 0) {
      setIsSubmitting(false);
      setErrorMessage("Add at least one topic rule.");
      return;
    }

    const payload = {
      positionTitle: formState.positionTitle.trim(),
      mode: examMode,
      durationMinutes: formState.durationMinutes ? Number(formState.durationMinutes) : null,
      windowStartTime: formState.windowStartTime || null,
      windowEndTime: formState.windowEndTime || null,
      questionIds: usesQuestions(examMode) ? uniqueIds : [],
      topicRules: usesTopicRules(examMode) ? normalizedTopicRules : [],
    };

    try {
      const savedExam = await updateExam(exam.id, payload);
      router.push(`/exams/${savedExam.id}?success=updated`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("failed-update"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="positionTitle">
              {t("position-title")}
            </label>
            <Input
              id="positionTitle"
              value={formState.positionTitle}
              onChange={(e) => setFormState((current) => ({ ...current, positionTitle: e.target.value }))}
              placeholder={t("position-title-placeholder")}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="durationMinutes">
              {t("duration-minutes")}
            </label>
            <Input
              id="durationMinutes"
              type="number"
              min={1}
              value={formState.durationMinutes}
              onChange={(e) => setFormState((current) => ({ ...current, durationMinutes: e.target.value }))}
              placeholder={t("duration-placeholder")}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="examMode">
              Exam mode
            </label>
            <select
              id="examMode"
              value={examMode}
              onChange={(event) => {
                setErrorMessage(null);
                setExamMode(event.target.value as ExamMode);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="static">Static</option>
              <option value="dynamic">Dynamic</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="windowStartTime">
                {t("window-start")}
              </label>
              <Input
                id="windowStartTime"
                type="datetime-local"
                value={formState.windowStartTime}
                onChange={(e) => setFormState((current) => ({ ...current, windowStartTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="windowEndTime">
                {t("window-end")}
              </label>
              <Input
                id="windowEndTime"
                type="datetime-local"
                value={formState.windowEndTime}
                onChange={(e) => setFormState((current) => ({ ...current, windowEndTime: e.target.value }))}
              />
            </div>
          </div>

          {usesQuestions(examMode) ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t("questions")}</label>
            <ExamQuestionPicker
              selectedQuestionIds={selectedQuestionIds}
              onChange={setSelectedQuestionIds}
            />
          </div>
          ) : null}

          {usesTopicRules(examMode) ? (
            <ExamTopicRulesEditor rules={topicRules} onChange={setTopicRules} />
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("save-changes")}
            </Button>
            <Button as="link" href={`/exams/${exam.id}`} variant="secondary">
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
