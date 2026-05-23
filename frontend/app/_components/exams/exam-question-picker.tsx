"use client";

import { useEffect, useState } from "react";
import { Loader, Search } from "lucide-react";
import { questionBankService } from "@/app/_services/question-bank-service";
import { topicService } from "@/app/_services/topic-service";
import type { Question as BankQuestion, Topic } from "@/app/_lib/question-bank.types";
import { useTranslations } from "next-intl";
import { Button } from "@/app/_components/ui/button";

const PAGE_SIZE = 10;

type ExamQuestionPickerProps = {
  selectedQuestionIds: number[];
  onChange: (questionIds: number[]) => void;
};

export default function ExamQuestionPicker({
  selectedQuestionIds,
  onChange,
}: ExamQuestionPickerProps) {
  const t = useTranslations("Exams");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    async function loadTopics() {
      setIsLoadingTopics(true);
      setTopicsError(null);

      try {
        const data = await topicService.getTopics();
        setTopics(data ?? []);
      } catch (error) {
        setTopicsError(error instanceof Error ? error.message : t("failed-load-topics"));
      } finally {
        setIsLoadingTopics(false);
      }
    }

    loadTopics();
  }, []);

  useEffect(() => {
    async function loadQuestions() {
      setIsLoadingQuestions(true);
      setQuestionsError(null);

      try {
        const response = await questionBankService.getQuestions(
          currentPage,
          PAGE_SIZE,
          selectedTopicId || "all",
          searchTerm,
        );
        setQuestions(response.data ?? []);
        setTotalPages(response.totalPages ?? 1);
      } catch (error) {
        setQuestionsError(
          error instanceof Error ? error.message : t("failed-load-questions"),
        );
        setQuestions([]);
        setTotalPages(1);
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    loadQuestions();
  }, [currentPage, searchTerm, selectedTopicId]);

  function handleToggleQuestion(questionId: number) {
    const next = selectedQuestionIds.includes(questionId)
      ? selectedQuestionIds.filter((id) => id !== questionId)
      : [...selectedQuestionIds, questionId];

    onChange(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="flex max-h-[68vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex-shrink-0">
          <p className="text-sm font-semibold text-slate-900">{t("topics-title")}</p>
          <p className="text-xs text-slate-500">{t("topics-desc")}</p>
        </div>

        {isLoadingTopics ? (
          <div className="mt-4 flex items-center gap-2 text-slate-500">
            <Loader className="animate-spin" size={16} /> {t("loading-topics")}
          </div>
        ) : topicsError ? (
          <p className="mt-4 text-sm text-red-600">{topicsError}</p>
        ) : topics.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">{t("no-topics")}</p>
        ) : (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTopicId("all");
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  selectedTopicId === "all"
                    ? "border-blue-500 bg-blue-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {t("all-questions")}
              </button>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopicId(topic.id.toString());
                    setCurrentPage(1);
                    setSearchTerm("");
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedTopicId === topic.id.toString()
                      ? "border-blue-500 bg-blue-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {topic.topicName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex max-h-[68vh] flex-col space-y-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("questions-title")}</p>
            <p className="text-xs text-slate-500">
              {t("questions-desc")}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {selectedQuestionIds.length} {t("selected-count")}
          </span>
        </div>

        <div className="relative flex-shrink-0">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("search-questions")}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoadingQuestions ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              <div className="inline-flex items-center gap-2">
                <Loader className="animate-spin" size={16} /> {t("loading-questions")}
              </div>
            </div>
          ) : questionsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
              {questionsError}
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              {t("no-questions")}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {questions.map((question) => (
                  <label
                    key={question.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(question.id)}
                      onChange={() => handleToggleQuestion(question.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        #{question.id} {question.questionText}
                      </p>
                      {question.topicName ? (
                        <p className="mt-1 text-xs text-slate-500">{t("topic")}: {question.topicName}</p>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    {t("page")} {currentPage} {t("of")} {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || isLoadingQuestions}
                    >
                      {t("previous")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages || isLoadingQuestions}
                    >
                      {t("next")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
