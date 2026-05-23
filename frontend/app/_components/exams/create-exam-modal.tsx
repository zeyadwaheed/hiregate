"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import ExamQuestionPicker from "@/app/_components/exams/exam-question-picker";
import { createExam } from "@/app/_services/exam-service";
import type { ExamFormState } from "@/app/_lib/exams/exam-form.types";
import { validateExamForm } from "@/app/_validations/exams/admin-exam-form";
import { useTranslations } from "next-intl";

type CreateExamModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function formatDateTimePreview(value: string, t: any) {
  if (!value) {
    return t("no-date-selected");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("invalid-date");
  }

  return date.toLocaleString();
}

function CreateExamModal({ isOpen, onClose }: CreateExamModalProps) {
  const router = useRouter();
  const t = useTranslations("Exams");
  const [step, setStep] = useState<1 | 2>(1);
  const [formState, setFormState] = useState<ExamFormState>({
    positionTitle: "",
    durationMinutes: "",
    windowStartTime: "",
    windowEndTime: "",
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasTriedStepOne, setHasTriedStepOne] = useState(false);

  const updateFormField = (field: keyof ExamFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));

    if (!hasTriedStepOne) {
      return;
    }

    setFormErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  function handleQuestionSelectionChange(questionIds: number[]) {
    setErrorMessage(null);
    setSelectedQuestionIds(questionIds);
  }

  function validateStepOne(): boolean {
    setHasTriedStepOne(true);
    const errors = validateExamForm(formState);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateExam() {
    if (selectedQuestionIds.length === 0) {
      setErrorMessage(t("select-at-least-one"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        positionTitle: formState.positionTitle.trim(),
        durationMinutes: formState.durationMinutes ? Number(formState.durationMinutes) : null,
        windowStartTime: formState.windowStartTime || null,
        windowEndTime: formState.windowEndTime || null,
        questionIds: selectedQuestionIds,
      };

      const savedExam = await createExam(payload);
      onClose();
      router.push(`/exams/${savedExam.id}?success=created`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("failed-create"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative z-10 mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{t("create-exam")}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {step === 1 ? t("exam-details") : t("pick-questions-by-topic")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {step === 1
                ? t("step1-desc")
                : t("step2-desc")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close create exam modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span
              className={`rounded-full px-3 py-1 ${
                step === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {t("step1")}
            </span>
            <span
              className={`rounded-full px-3 py-1 ${
                step === 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {t("step2")}
            </span>
          </div>

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="positionTitle">
                  {t("position-title")}
                </label>
                <input
                  id="positionTitle"
                  type="text"
                  value={formState.positionTitle}
                  onChange={(e) => updateFormField("positionTitle", e.target.value)}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    hasTriedStepOne && formErrors.positionTitle
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                  placeholder={t("position-title-placeholder")}
                />
                {hasTriedStepOne && formErrors.positionTitle ? (
                  <p className="mt-2 text-sm text-red-600">{formErrors.positionTitle}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="durationMinutes">
                  {t("duration-minutes")}
                </label>
                <input
                  id="durationMinutes"
                  type="number"
                  min={1}
                  value={formState.durationMinutes}
                  onChange={(e) => updateFormField("durationMinutes", e.target.value)}
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    hasTriedStepOne && formErrors.durationMinutes
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                  placeholder={t("duration-placeholder")}
                />
                {hasTriedStepOne && formErrors.durationMinutes ? (
                  <p className="mt-2 text-sm text-red-600">{formErrors.durationMinutes}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="windowStartTime">
                    {t("window-start")}
                  </label>
                  <input
                    id="windowStartTime"
                    type="datetime-local"
                    value={formState.windowStartTime}
                    onChange={(e) => updateFormField("windowStartTime", e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                      hasTriedStepOne && formErrors.windowStartTime
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                  {hasTriedStepOne && formErrors.windowStartTime ? (
                    <p className="mt-2 text-sm text-red-600">{formErrors.windowStartTime}</p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      {formState.windowStartTime
                        ? `${t("selected")} ${formatDateTimePreview(formState.windowStartTime, t)}`
                        : t("browser-highlight-info")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="windowEndTime">
                    {t("window-end")}
                  </label>
                  <input
                    id="windowEndTime"
                    type="datetime-local"
                    value={formState.windowEndTime}
                    onChange={(e) => updateFormField("windowEndTime", e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                      hasTriedStepOne && formErrors.windowEndTime
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                  {hasTriedStepOne && formErrors.windowEndTime ? (
                    <p className="mt-2 text-sm text-red-600">{formErrors.windowEndTime}</p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      {formState.windowEndTime
                        ? `${t("selected")} ${formatDateTimePreview(formState.windowEndTime, t)}`
                        : t("browser-highlight-info")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <ExamQuestionPicker
              selectedQuestionIds={selectedQuestionIds}
              onChange={handleQuestionSelectionChange}
            />
          )}

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <div className="flex flex-wrap gap-3">
              {step === 2 ? (
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  {t("back")}
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={
                  step === 1
                    ? () => {
                        if (validateStepOne()) {
                          setHasTriedStepOne(false);
                          setStep(2);
                        }
                      }
                    : handleCreateExam
                }
                disabled={step === 2 ? isSubmitting : false}
              >
                {step === 1 ? t("next") : isSubmitting ? t("creating") : t("create-exam")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateExamAction() {
  const t = useTranslations("Exams");
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <Button type="button" size="lg" className="w-46 !text-white" onClick={handleOpen}>
        <Plus size={20} />
        {t("create-exam")}
      </Button>
      {isOpen ? <CreateExamModal isOpen={isOpen} onClose={handleClose} /> : null}
    </>
  );
}
