"use client";

import { useEffect, useState } from "react";
import Header from "@/app/_components/layout/header";
import CreateExamAction from "@/app/_components/exams/create-exam-modal";
import ExamCard from "@/app/_components/exams/exam-card";
import { getExamsPage } from "@/app/_services/exam-service";
import { PaginationControls } from "@/app/_components/pagination-controls";
import type { ExamSummary } from "@/app/_lib/exams/exam.types";
import { useTranslations } from "next-intl";

export default function ExamsPage() {
  const t = useTranslations("Exams");
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // refreshKey to trigger refetch when exams are modified (e.g., deleted)
  useEffect(() => {
    async function fetchExams() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const result = await getExamsPage(currentPage);
        
      // If current page became empty after deletion
      // and there is a previous page, go back
      if (
        result.data.length === 0 &&
        currentPage > 1
          )
          {
        setCurrentPage((prev) => prev - 1);
        return;
          }
        setExams(result.data);
        setTotalPages(result.totalPages);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : t("failed-load-exams")
        );
      } finally {
        setLoading(false);
      }
    }

    fetchExams();
  }, [currentPage, refreshKey]); // refreshKey added to dependencies to trigger refetch on change

  return (
    <section>
      <Header
        title={t("exams-management")}
        description={t("exams-management-desc")}
        action={<CreateExamAction />}
      />

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!errorMessage && !loading && exams.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          {t("no-exams")}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">{t("loading-exams")}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onDeleted={() => setRefreshKey((k) => k + 1)} /* increment to trigger refresh */
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          loading={loading}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>
    </section>
  );
}
