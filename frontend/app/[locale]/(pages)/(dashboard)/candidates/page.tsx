"use client";

import { useEffect, useState } from "react";
import { useCandidates } from "@/app/_hooks/use-candidates";
import { AlertMessage } from "@/app/_components/question-bank/alert-message";
import { CandidateHeader } from "@/app/_components/candidates/candidate-header";
import { CreateCandidateCard } from "@/app/_components/candidates/create-candidate-card";
import { CandidateSearch } from "@/app/_components/candidates/candidate-search";
import { CandidateFilter } from "@/app/_components/candidates/candidate-filter";
import { CandidateExamFilter } from "@/app/_components/candidates/candidate-exam-filter";
import { CandidateTable } from "@/app/_components/candidates/candidate-table";
import { PaginationControls } from "@/app/_components/pagination-controls";
import { CandidateDetailsModal } from "@/app/_components/candidates/candidate-details-modal";
import { DeleteConfirmationModal } from "@/app/_components/question-bank/delete-confirmation-modal";
import { SendEmailModal } from "@/app/_components/candidates/send-email-modal";
import { getCandidateExamReview } from "@/app/_services/candidate-service";
import { getExamTitles } from "@/app/_services/exam-service";
import ExamReviewModal from "@/app/_components/candidates/exam-review-modal";

export default function CandidatesPage() {
  const {
    loading,
    selected,
    setSelected,

    search,
    setSearch,

    statusFilter,
    setStatusFilter,

    examFilter,
    setExamFilter,

    currentPage,
    setCurrentPage,
    totalPages,

    candidates,

    createMessage,
    setCreateMessage,

    email,
    setEmail,

    handleCreate,

    deleteCandidate,
    setDeleteCandidate,
    confirmDelete,

    sendEmailCandidate,
    setSendEmailCandidate,
    handleSendEmail,

    emailLoading,
    emailMessage,

    getStatus,
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage,
  } = useCandidates();

  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [examOptions, setExamOptions] = useState<Array<{ id: number; title: string }>>([]);
  const [examOptionsLoading, setExamOptionsLoading] = useState(false);

  // =========================
  // EXAM REVIEW STATE
  // =========================
  const [examReview, setExamReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadExamOptions() {
      try {
        setExamOptionsLoading(true);
        const exams = await getExamTitles();

        if (isMounted) {
          setExamOptions(exams);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load exams";
        if (isMounted) {
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setExamOptionsLoading(false);
        }
      }
    }

    void loadExamOptions();

    return () => {
      isMounted = false;
    };
  }, [setErrorMessage]);

  const scrollToTop = () => {
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  const handleBulkEmailSuccess = (message: string) => {
    setSuccessMessage(message);
    scrollToTop();
  };

  const handleBulkEmailError = (message: string) => {
    setErrorMessage(message);
    scrollToTop();
  };

  const handleSingleEmailSubmit = async (candidateId: number, examId: number) => {
    await handleSendEmail(candidateId, examId);
    scrollToTop();
  };

  // =========================
  // FETCH EXAM REVIEW
  // =========================

const handleShowExam = async (candidateId: number) => {
  try {
    setReviewLoading(true);
    setErrorMessage(null);

    const review = await getCandidateExamReview(candidateId);
    console.log("Fetched exam reviewwwwwwwwwwwww:", review);
    setExamReview(review);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load exam review";
    setErrorMessage(message);
    setExamReview(null);
  } finally {
    setReviewLoading(false);
  }
};


  return (
    <div className="space-y-6">

      {/* ALERTS */}
      <AlertMessage
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />

      <AlertMessage
        type="error"
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />

      {/* HEADER */}
      <CandidateHeader
        loading={loading}
        onBulkEmail={() => setBulkEmailOpen(true)}
      />

      {/* CREATE */}
      <CreateCandidateCard
        email={email}
        setEmail={setEmail}
        onCreate={handleCreate}
      />

{/* SEARCH + FILTER */}
<div className="flex w-full items-center gap-3">
  <CandidateSearch
    value={search}
    onChange={(value) => {
      setSearch(value);
      setCurrentPage(1);
    }}
  />
 <CandidateExamFilter
    value={examFilter}
    exams={examOptions}
    loading={examOptionsLoading}
    onChange={(value) => {
      setExamFilter(value);
      setCurrentPage(1);
    }}
  />
  <CandidateFilter
    value={statusFilter}
    onChange={(value) => {
      setStatusFilter(value);
      setCurrentPage(1);
    }}
  />

 
</div>

      {/* TABLE */}
      <CandidateTable
        candidates={candidates}
        loading={loading}
        getStatus={getStatus}
        onView={setSelected}
        onDelete={setDeleteCandidate}
        onSendEmail={setSendEmailCandidate}
        onShowExam={handleShowExam}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        loading={loading}
        onPrev={() => setCurrentPage(Math.max(1, currentPage - 1))}
        onNext={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
      />

      {/*we are NOT controlling whether it should render or not
      So React always keeps it in the tree with changing props (selected changes every click).*/}
      {/* MODALS */}
      {selected && ( //stop rendering modals with null props}}
      <CandidateDetailsModal
        candidate={selected}
        onClose={() => setSelected(null)}
      />
      )}   

      {deleteCandidate && (

      <DeleteConfirmationModal
        isOpen={deleteCandidate !== null}
        loading={loading}
        title="Delete Candidate"
        description="This action cannot be undone."
        itemLabel={deleteCandidate?.email}
        confirmLabel="Delete"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
      />
      )}

      <SendEmailModal
        variant="bulk"
        open={bulkEmailOpen}
        onClose={() => setBulkEmailOpen(false)}
        onSuccess={handleBulkEmailSuccess}
        onError={handleBulkEmailError}
      />

      <SendEmailModal
        variant="single"
        candidate={sendEmailCandidate}
        loading={emailLoading}
        onClose={() => setSendEmailCandidate(null)}
        onSubmit={handleSingleEmailSubmit}
      />

      {/* EXAM REVIEW MODAL */}
      {examReview && (
      <ExamReviewModal
        data={examReview}
        loading={reviewLoading}
        onClose={() => setExamReview(null)}
      />
      )}
    </div>
  );
}
