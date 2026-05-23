"use client";

import { FormEvent, useRef, useState } from "react";
import { HelpCircle, ImageIcon, Loader, X } from "lucide-react";
import Input from "@/app/_components/ui/input";
import { QuestionFormData, Topic } from "@/app/_lib/question-bank.types";
import { useDisableBodyScroll, restoreBodyScroll } from "@/app/_hooks/useDisableBodyScroll";
import { questionBankService } from "@/app/_services/question-bank-service";

interface QuestionFormModalProps {
  isOpen: boolean;
  isEditingMode: boolean;
  loading: boolean;
  topics: Topic[];
  formData: QuestionFormData;
  formError: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  setFormData: (data: QuestionFormData) => void;
}

const choiceLetter = (index: number) => String.fromCharCode(65 + index);

export function QuestionFormModal({
  isOpen,
  isEditingMode,
  loading,
  topics,
  formData,
  formError,
  onClose,
  onSubmit,
  setFormData,
}: QuestionFormModalProps) {
  useDisableBodyScroll(isOpen);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { imageUrl } = await questionBankService.uploadQuestionImage(file);
      setFormData({ ...formData, imageUrl });
    } catch {
      // surface the error without crashing the form
      alert("Image upload failed. Please try again.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onRemoveImage = () => {
    setFormData({ ...formData, imageUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isOpen) {
    return null;
  }

  const inputRing =
    "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4" onClick={() => { restoreBodyScroll(); onClose(); }}>
      <div className="flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
              {isEditingMode ? "Edit question" : "Add question"}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {isEditingMode ? "Update text, topic, and answers." : "Create a new exam question."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { restoreBodyScroll(); onClose(); }}
            className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close form"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </header>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-6">
              <section className="flex flex-col gap-3">
                <label htmlFor="question-text" className="block text-sm font-medium text-gray-700">
                  Question
                </label>
                <textarea
                  id="question-text"
                  value={formData.questionText}
                  onChange={(event) =>
                    setFormData({ ...formData, questionText: event.target.value })
                  }
                  className={`${inputRing} min-h-[100px] w-full resize-y`}
                  rows={4}
                  placeholder="Enter the question text"
                  required
                />
              </section>

              <section className="flex flex-col gap-3">
                <label htmlFor="question-image-file" className="block text-sm font-medium text-gray-700">
                  Image <span className="font-normal text-gray-400">(optional)</span>
                </label>

                <div className="flex items-center gap-3">
                  <label
                    htmlFor="question-image-file"
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors
                      ${isUploadingImage
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {isUploadingImage ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <ImageIcon size={16} />
                    )}
                    {isUploadingImage ? "Uploading…" : "Choose image"}
                  </label>
                  <input
                    ref={fileInputRef}
                    id="question-image-file"
                    type="file"
                    accept="image/*"
                    disabled={isUploadingImage}
                    onChange={onImageFileChange}
                    className="sr-only"
                  />
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={onRemoveImage}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      <X size={14} />
                      Remove
                    </button>
                  )}
                </div>

                {formData.imageUrl && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
                    <img
                      src={formData.imageUrl}
                      alt="Question image preview"
                      className="max-h-52 w-full object-contain"
                    />
                    <p className="border-t border-gray-100 px-3 py-1.5 text-xs text-gray-400">
                      Preview — hosted at {formData.imageUrl}
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <select
                  id="question-topic"
                  value={formData.topicId}
                  onChange={(event) =>
                    setFormData({ ...formData, topicId: event.target.value })
                  }
                  className={inputRing}
                  required
                >
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id.toString()}>
                      {topic.topicName}
                    </option>
                  ))}
                </select>
              </section>

              <section className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Answer options</label>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Exactly one option must be marked correct.
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                    title="Only one correct answer allowed"
                  >
                    <HelpCircle size={14} aria-hidden />
                    4 choices
                  </span>
                </div>

                <div className="space-y-3">
                  {formData.choices.map((choice, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-slate-50/50 p-3 sm:flex-row sm:items-center"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-700 shadow-sm ring-1 ring-gray-200">
                        {choiceLetter(index)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Input
                          value={choice.choiceText}
                          onChange={(event) => {
                            const updatedChoices = [...formData.choices];
                            updatedChoices[index] = {
                              ...updatedChoices[index],
                              choiceText: event.target.value,
                            };
                            setFormData({ ...formData, choices: updatedChoices });
                          }}
                          placeholder={`Option ${choiceLetter(index)}`}
                          required
                        />
                      </div>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 hover:border-slate-200 sm:shrink-0">
                        <input
                          type="checkbox"
                          checked={choice.isCorrect}
                          onChange={(event) => {
                            const updatedChoices = formData.choices.map((item, itemIndex) => ({
                              ...item,
                              isCorrect: itemIndex === index ? event.target.checked : false,
                            }));
                            setFormData({ ...formData, choices: updatedChoices });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Correct</span>
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <footer className="shrink-0 space-y-3 border-t border-gray-100 bg-slate-50/80 px-5 py-4 sm:px-6">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {formError}
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading && <Loader size={16} className="animate-spin" />}
                {isEditingMode ? "Save changes" : "Add question"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
