"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/app/_components/ui/button";
import Input from "@/app/_components/ui/input";
import { PaginationControls } from "@/app/_components/pagination-controls";
import { Candidate, getCandidatesPage } from "@/app/_services/candidate-service";
import { getExamsPage,} from "@/app/_services/exam-service";
import {type ExamSummary } from "@/app/_lib/exams/exam.types";
import { sendBulkExamEmail, sendExamEmail } from "@/app/_services/email-service";
import { validateSearch } from "@/app/_validations/candidate-validation";
import { useDisableBodyScroll } from "@/app/_hooks/useDisableBodyScroll";

const BULK_CANDIDATES_PAGE_SIZE = 10;
const EXAMS_PAGE_SIZE = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function getStringField(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return typeof value === "string" && value.trim() ? value : null;
}

function buildSingleEmailMessage(response: unknown) {
  if (!isRecord(response)) {
    return "Email sent successfully.";
  }

  return (
    getStringField(response, "message") ??
    getStringField(response, "error") ??
    getStringField(response, "data") ??
    "Email sent successfully."
  );
}

function buildBulkEmailMessage(response: unknown) {
  if (!isRecord(response) || !isRecord(response.data)) {
    return "Bulk emails sent successfully.";
  }

  const data = response.data;
  const results = Array.isArray(data.results) ? data.results : [];
  const notFoundIds = Array.isArray(data.notFoundIds) ? data.notFoundIds : [];
  const sentCount = results.filter((result) => {
    if (!isRecord(result)) {
      return false;
    }

    return getStringField(result, "status")?.toLowerCase() === "sent";
  }).length;
  const failedCount = results.filter((result) => {
    if (!isRecord(result)) {
      return false;
    }

    return getStringField(result, "status")?.toLowerCase() === "failed";
  }).length;
  const total =
    typeof data.total === "number"
      ? data.total
      : results.length + notFoundIds.length;

  let message = `Emails sent: ${sentCount} of ${total}`;
  if (failedCount > 0) {
    message += `. Failed: ${failedCount}`;
  }
  if (notFoundIds.length > 0) {
    message += `. Not found: ${notFoundIds.join(", ")}`;
  }

  return message;
}

type SingleProps = {
  variant: "single";
  candidate: Candidate | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (candidateId: number, examId: number) => void;
};

type BulkProps = {
  variant: "bulk";
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export type SendEmailModalProps = SingleProps | BulkProps;

// Shared exam picker component
function ExamsPickerBlock({
  selectedId,
  selectedTitle,
  onSelect,
  onClear,
  onBusyChange,
  compact = false,
}: {
  selectedId: number | "";
  selectedTitle: string;
  onSelect: (exam: ExamSummary) => void;
  onClear: () => void;
  onBusyChange?: (busy: boolean) => void;
  compact?: boolean;
}) {
  const radioGroupName = useId();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const lastDebouncedSearch = useRef<string | null>(null);
  const onBusyChangeRef = useRef(onBusyChange);
  onBusyChangeRef.current = onBusyChange;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const loadExams = async () => {
      const validationError = validateSearch(debouncedSearch);
      if (validationError) {
        setListError(validationError);
        setExams([]);
        setTotalPages(1);
        setFetchError("");
        setListLoading(false);
        onBusyChangeRef.current?.(false);
        return;
      }

      setListError("");
      setFetchError("");

      let pageToFetch = page;
      if (lastDebouncedSearch.current !== debouncedSearch) {
        lastDebouncedSearch.current = debouncedSearch;
        pageToFetch = 1;
        if (page !== 1) {
          setPage(1);
        }
      }

      setListLoading(true);
      onBusyChangeRef.current?.(true);
      try {
        const result = await getExamsPage(
          pageToFetch,
          debouncedSearch || undefined,
          //EXAMS_PAGE_SIZE
        );
        if (!cancelled) {
          setExams(result.data);
          const tp = result.totalPages <= 0 ? 1 : result.totalPages;
          setTotalPages(tp);
          setFetchError("");
          if (pageToFetch > tp) {
            setPage(tp);
          }
        }
      } catch (err) {
        console.error("Exams fetch error:", err);
        if (!cancelled) {
          setExams([]);
          setTotalPages(1);
          setFetchError("Failed to load exams.");
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
          onBusyChangeRef.current?.(false);
        }
      }
    };

    void loadExams();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch]);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <label className="block text-sm font-medium text-gray-700" htmlFor="exam-picker-search">
        Select exam
      </label>
      <Input
        id="exam-picker-search"
        type="text"
        placeholder="Search position…"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        className="text-sm"
      />

      {listError || fetchError ? (
        <p className="text-sm text-red-600">{listError || fetchError}</p>
      ) : null}

      {selectedId !== "" && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-sm text-blue-900">
            <strong>{selectedTitle || `Exam #${selectedId}`}</strong>
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        </div>
      )}

      <div className={`space-y-1 rounded-md border border-gray-200 p-2 ${compact ? "max-h-48" : "min-h-[10rem]"} overflow-y-auto`}>
        {listLoading ? (
          <p className="p-2 text-center text-sm text-gray-500">Loading…</p>
        ) : exams.length === 0 ? (
          <p className="p-2 text-center text-sm text-gray-500">No exams found.</p>
        ) : (
          exams.map((exam) => (
            <label
              key={exam.id}
              className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
            >
              <input
                type="radio"
                name={radioGroupName}
                checked={selectedId === exam.id}
                onChange={() => onSelect(exam)}
              />
              <span className="text-sm text-gray-900">{exam.positionTitle}</span>
            </label>
          ))
        )}
      </div>
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          loading={listLoading}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      
    </div>
  );
}

// Single candidate modal - compact and focused
function SingleSendEmailModal({
  candidate,
  loading,
  onClose,
  onSubmit,
}: Omit<SingleProps, "variant">) {
  const [selectedExamId, setSelectedExamId] = useState<number | "">("");
  const [selectedExamTitle, setSelectedExamTitle] = useState("");
  const [examListBusy, setExamListBusy] = useState(true);



  // Reset selections when candidate changes
  useEffect(() => {
    setSelectedExamId("");
    setSelectedExamTitle("");
  }, [candidate?.id]);

  useDisableBodyScroll();

  if (!candidate) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto lg:overflow-hidden px-4 py-6" onClick={onClose}>
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* MODAL */}
      <div className="relative z-10 mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-lg lg:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-base font-bold text-gray-900">Send exam email</h2>
<p className="mt-1 text-sm text-gray-600">
  to{" "}
  <strong>
    {`${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim() ||
      candidate.email}
  </strong>
</p>
        </div>

        <ExamsPickerBlock
          selectedId={selectedExamId}
          selectedTitle={selectedExamTitle}
          onSelect={(exam) => {
            setSelectedExamId(exam.id);
            setSelectedExamTitle(exam.positionTitle);
          }}
          onClear={() => {
            setSelectedExamId("");
            setSelectedExamTitle("");
          }}
          onBusyChange={setExamListBusy}
          compact
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button
            type="button"
            size="md"
            disabled={loading || examListBusy || selectedExamId === ""}
            onClick={() => onSubmit(candidate.id, Number(selectedExamId))}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

// Bulk email modal - split into logical columns on desktop
function BulkSendEmailModal({
  onClose,
  onSuccess,
  onError,
}: Omit<BulkProps, "variant" | "open">) {
  //const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidates, setCandidates] = useState<{
  items: Candidate[];
  totalCount: number;
}>({
  items: [],
  totalCount: 0,
});
  const [selectedExamId, setSelectedExamId] = useState<number | "">("");
  const [selectedExamTitle, setSelectedExamTitle] = useState("");
  const [examListBusy, setExamListBusy] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [listError, setListError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const lastDebouncedSearch = useRef<string | null>(null);

  useDisableBodyScroll();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
const emptyCandidatesState = {
  items: [],
  totalCount: 0,
};
setCandidates(emptyCandidatesState);
    
    const loadCandidates = async () => {
      const validationError = validateSearch(debouncedSearch);
      if (validationError) {
        setListError(validationError);
        setCandidates(emptyCandidatesState);
        setTotalPages(1);
        setFetchError("");
        setListLoading(false);
        return;
      }

      setListError("");
      setFetchError("");

      let pageToFetch = currentPage;
      if (lastDebouncedSearch.current !== debouncedSearch) {
        lastDebouncedSearch.current = debouncedSearch;
        pageToFetch = 1;
        if (currentPage !== 1) {
          setCurrentPage(1);
        }
      }

      setListLoading(true);
      try {
        const result = await getCandidatesPage(
          pageToFetch,
          debouncedSearch || undefined,
          undefined,
          BULK_CANDIDATES_PAGE_SIZE
        );
        if (!cancelled) {
          setCandidates(result.data); // items or data ?
          const tp = result.totalPages <= 0 ? 1 : result.totalPages;
          setTotalPages(tp);
          setFetchError("");
          if (pageToFetch > tp) {
            setCurrentPage(tp);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (!cancelled) {
          setCandidates(emptyCandidatesState);
          setTotalPages(1);
          setFetchError("Failed to load candidates.");
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    void loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [currentPage, debouncedSearch]);

  const toggleCandidate = (id: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    try {
      setSending(true);

      if (selectedExamId === "") {
        const validationMessage = "Please select an exam.";
        onError(validationMessage);
        return;
      }

      if (selectedCandidates.length === 0) {
        const validationMessage = "Please select at least one candidate.";
        onError(validationMessage);
        return;
      }

      const examId = Number(selectedExamId);

      if (selectedCandidates.length === 1) {
        const res = await sendExamEmail(selectedCandidates[0], examId);
        onSuccess(buildSingleEmailMessage(res));
        onClose();
        return;
      }

      const res = await sendBulkExamEmail({
        examId,
        candidateIds: selectedCandidates,
      });

      onSuccess(buildBulkEmailMessage(res));
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Request failed.";
      onError(errorMessage);
    } finally {
      setSending(false);
    }
    
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto lg:overflow-hidden bg-black/40 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg lg:flex-row lg:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Left panel: Exam selection */}
        <div className="flex flex-col border-b border-gray-200 p-5 lg:w-1/3 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-2 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Email center</h2>
              <p className="mt-1 text-sm text-gray-600">Choose exam & recipients</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button> 
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-1">
              <span className="block text-sm font-semibold text-gray-700">Exam</span>
              <ExamsPickerBlock
                selectedId={selectedExamId}
                selectedTitle={selectedExamTitle}
                onSelect={(exam) => {
                  setSelectedExamId(exam.id);
                  setSelectedExamTitle(exam.positionTitle);
                }}
                onClear={() => {
                  setSelectedExamId("");
                  setSelectedExamTitle("");
                }}
                onBusyChange={setExamListBusy}
                compact
              />
            </div>
          </div>
        </div>

        {/* Right panel: Candidate selection */}
        <div className="flex flex-1 flex-col overflow-hidden lg:w-2/3">
          <div className="flex-none space-y-3 border-b border-gray-200 p-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700" htmlFor="bulk-email-search">
                Search candidates
              </label>
              <Input
                id="bulk-email-search"
                type="text"
                placeholder="Name, email, phone…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="mt-2 text-sm"
              />
              {listError || fetchError ? (
                <p className="mt-1 text-sm text-red-600">{listError || fetchError}</p>
              ) : null}
            </div>
            
            {selectedCandidates.length > 0 && (
              <div className="rounded-md bg-green-50 px-3 py-2">
                <p className="text-sm font-medium text-green-800">
                  {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="space-y-2">
              <span className="block text-sm font-semibold text-gray-700">Recipients</span>
              <div className="space-y-1 rounded-md border border-gray-200 p-2">
                {listLoading ? (
                  <p className="p-2 text-center text-sm text-gray-500">Loading…</p>
                ) : candidates.items.length === 0 ? (
                  <p className="p-2 text-center text-sm text-gray-500">No candidates.</p>
                ) : (
                  candidates.items.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(c.id)}
                        onChange={() => toggleCandidate(c.id)}
                      />
                      <span className="text-sm text-gray-900">
                        {`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—"}
                      </span>
                      <span className="ml-auto text-sm text-gray-500">{c.email}</span>
                    </label>
                  ))
                )}
              </div>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  loading={listLoading}
                  onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
            </div>
          </div>

          <div className="flex-none border-t border-gray-200 p-5">
            {/* No inline message rendering. All feedback handled by AlertMessage in CandidatesPage. */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose} size="md">
                Close
              </Button>
              <Button
                type="button"
                size="md"
                disabled={sending || listLoading || examListBusy || selectedExamId === ""}
                onClick={() => void handleSend()}
              >
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SendEmailModal(props: SendEmailModalProps) {
  if (props.variant === "bulk") {
    if (!props.open) {
      return null;
    }
    return (
      <BulkSendEmailModal
        onClose={props.onClose}
        onSuccess={props.onSuccess}
        onError={props.onError}
      />
    );
  }

  if (!props.candidate) {
    return null;
  }

  return (
    <SingleSendEmailModal
      candidate={props.candidate}
      loading={props.loading}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}
