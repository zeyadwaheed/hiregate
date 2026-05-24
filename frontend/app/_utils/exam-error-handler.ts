import type { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;

export function handleExamError(err: any, router: Router) {
  const message = (err?.error || err?.message || "").toLowerCase();

  // already submitted → go thank you page
  const isCompletedExam =
    message.includes("already submitted") ||
    message.includes("exam completed");

  // invalid token / fake user → error page
  const isInvalidToken =
    message.includes("invalid token") ||
    message.includes("candidate not found") ||
    message.includes("exam not assigned") ||
    message.includes("token missing") ||
    message.includes("unauthorized") ||
    message.includes("forbidden");

  // exam not found (treat as invalid access)
  const isNotFound =
    message.includes("exam not found");

  // window closed (DO NOT redirect, UI handles it)
  const isWindowIssue =
    message.includes("exam window is not open") ||
    message.includes("your exam time has finished");

  if (isCompletedExam) {
    router.replace("/candidates/thank-you");
    return true;
  }

  if (isInvalidToken || isNotFound) {
    router.replace("/error");
    return true;
  }

  if (isWindowIssue) {
    // IMPORTANT: no redirect (handled in exam page UI)
    return false;
  }

  return false;
}