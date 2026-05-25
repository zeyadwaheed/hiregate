"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Candidate,
  createCandidate,
  deleteCandidate,
  getCandidatesPage,
} from "@/app/_services/candidate-service";

import { sendExamEmail } from "@/app/_services/exam-service";

import {
  validateCandidateEmail,
  validateSearch,
} from "@/app/_validations/candidate-validation";

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState<Candidate | null>(null);

  const [deleteCandidateState, setDeleteCandidate] = useState<Candidate | null>(null);

  const [sendEmailCandidate, setSendEmailCandidate] = useState<Candidate | null>(null);

  const [loading, setLoading] = useState(true);

  // CREATE
  const [email, setEmail] = useState("");

  const [createMessage, setCreateMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  useEffect(() => {
    if (!successMessage) {
      setIsSuccessVisible(false);
      return;
    }

    setIsSuccessVisible(true);
    const hideTimer = window.setTimeout(() => setIsSuccessVisible(false), 2000);
    const removeTimer = window.setTimeout(() => setSuccessMessage(null), 3000);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [successMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const removeTimer = window.setTimeout(() => setErrorMessage(null), 3000);

    return () => {
      window.clearTimeout(removeTimer);
    };
  }, [errorMessage]);

  // FILTER
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [examFilter, setExamFilter] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  // EMAIL
  const [emailLoading, setEmailLoading] = useState(false);

  const [emailMessage, setEmailMessage] = useState("");

  const fetchPage = useCallback(
    async (page: number) => {
      const validationError = validateSearch(search);
      if (validationError) {
        setCandidates([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const trimmed = search.trim();
        const result = await getCandidatesPage(
          page,
          trimmed || undefined,
          statusFilter === "All" ? undefined : statusFilter,
          examFilter ?? undefined
        );

        setCandidates(result.data.items);

        const tp = result.totalPages <= 0 ? 1 : result.totalPages;
        setTotalPages(tp);

        if (page > tp) {
          setCurrentPage(tp);
        }
      } catch (err) {
        console.error(err);
        setCandidates([]);
        setTotalPages(1);
        setErrorMessage(err instanceof Error ? err.message : "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, examFilter]
  );

  useEffect(() => {
    void fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  // CREATE
  const handleCreate = async () => {
    setCreateMessage("");
    setErrorMessage(null);

    const validationError = validateCandidateEmail(email);

    if (validationError) {
      setCreateMessage(validationError);

      return;
    }

    try {
      const result = await createCandidate(email);

      setCreateMessage(result.message);
      setSuccessMessage(result.message);

      setEmail("");

      if (currentPage === 1) {
        await fetchPage(1);
      } else {
        setCurrentPage(1);
      }
    } catch (err: any) {
      setCreateMessage(err.message);
      setErrorMessage(err.message);
    }
  };

  // DELETE
  const confirmDelete = async () => {
    if (!deleteCandidateState) return;

    try {
      setLoading(true);
      await deleteCandidate(deleteCandidateState.id);

      setDeleteCandidate(null);

      await fetchPage(currentPage);
      setSuccessMessage("Candidate deleted successfully.");
    } catch (err: any) {
      console.error(err.message);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (candidate: Candidate) => {
    if (candidate.submittedAt) return "Submitted";

    if (candidate.startedAt) return "In Progress";

    return "Pending";
  };

  // SEND EMAIL
  const handleSendEmail = async (candidateId: number, examId: number) => {
    try {
      setEmailLoading(true);

      setEmailMessage("");
      setErrorMessage(null);

      const res = await sendExamEmail(candidateId, examId);

      setEmailMessage(res);
      setSuccessMessage(res);

      setSendEmailCandidate(null);
    } catch (err: any) {
      setEmailMessage(err.message);
      setErrorMessage(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  return {
    candidates,
    selected,
    setSelected,

    deleteCandidate: deleteCandidateState,

    setDeleteCandidate,

    sendEmailCandidate,
    setSendEmailCandidate,

    loading,

    email,
    setEmail,

    createMessage,
    setCreateMessage,

    search,
    setSearch,

    statusFilter,
    setStatusFilter,

    examFilter,
    setExamFilter,

    currentPage,
    setCurrentPage,
    totalPages,

    emailLoading,
    emailMessage,

    handleCreate,
    confirmDelete,

    handleSendEmail,

    getStatus,
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage,
    isSuccessVisible,
  };
}
