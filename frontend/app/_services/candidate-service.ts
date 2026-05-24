// =============================================================================
// CANDIDATE SERVICE
// Merged from candidate-service.ts + candidate-exam-service.ts
// =============================================================================

//const BASE_URL = "http://localhost:5116";
const CANDIDATES_URL = 'http://localhost:5116/candidates';

// -----------------------------------
// AUTH HEADERS (browser-safe)
// -----------------------------------
const authHeaders = (): HeadersInit => {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// -----------------------------------
// SAFE FETCH WRAPPER (no-auth, used by candidate-facing exam pages)
// -----------------------------------
async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error((data && data.message) || data || "Request failed");
  }

  return data;
}

// =============================================================================
// TYPES
// =============================================================================

export type Candidate = {
  id: number;
  examId: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  token: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  finalScore: number | null;
};

export type CandidateExamReview = {
  candidateId: number;
  candidateName: string;
    candidateEmail: string; // ✅ ADD THIS
  examTitle: string;
  finalScore: number | null;
  questions: Array<{
    questionId: number;
    questionText: string;
    questionImage: string | null;
    selectedChoiceId: number | null;
    isCorrect: boolean;
    choices: Array<{
      id: number;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
};
/*
export type CandidatesPaginatedResponse = {
  data: Candidate[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
*/

export type CandidatesPaginatedResponse = {
  data: {
    items: Candidate[];
    totalCount: number;
  };
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function getApiError(payload: unknown, fallback: string) {
  if (isRecord(payload)) {
    const error = payload.error ?? payload.message;
    if (typeof error === "string" && error.trim()) {
      return error;
    }
  }

  return fallback;
}

function unwrapApiData<T>(payload: unknown): T {
  if (isRecord(payload) && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

async function readJsonResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const text = await res.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    if (!res.ok) {
      throw new Error(text || fallbackError);
    }

    throw new Error("Invalid JSON response");
  }

  if (!res.ok || (isRecord(payload) && payload.success === false)) {
    throw new Error(getApiError(payload, fallbackError));
  }

  return unwrapApiData<T>(payload);
}

// -----------------------------------
// GET (paginated)
// -----------------------------------
//Loads one page. Omit `pageSize` to use the API default (10). */

export async function getCandidatesPage(
  page: number,
  search?: string,
  status?: string,
  pageSize?: number,
): Promise<CandidatesPaginatedResponse> {
  const params = new URLSearchParams({ page: String(Math.max(1, page)) });
  if (pageSize !== undefined) params.set("pageSize", String(pageSize));

  const trimmed = search?.trim();
  if (trimmed) params.set("search", trimmed);

  const trimmedStatus = status?.trim();
  if (trimmedStatus && trimmedStatus !== "All") params.set("status", trimmedStatus);

  const res = await fetch(`${CANDIDATES_URL}?${params}`, { headers: authHeaders() });
  const parsed = await readJsonResponse<unknown>(res, "Failed to fetch candidates");
  const requestedPage = Math.max(1, page);
  const requestedPageSize = pageSize ?? 10;

  if (isRecord(parsed) && Array.isArray(parsed.items)) {
    const items = parsed.items as Candidate[];
    const totalCount = typeof parsed.totalCount === "number" ? parsed.totalCount : items.length;

    return {
      data: {
        items,
        totalCount,
      },
      page: typeof parsed.page === "number" ? parsed.page : requestedPage,
      pageSize: typeof parsed.pageSize === "number" ? parsed.pageSize : requestedPageSize,
      totalCount,
      totalPages:
        typeof parsed.totalPages === "number"
          ? parsed.totalPages
          : Math.max(1, Math.ceil(totalCount / requestedPageSize)),
    };
  }

  if (Array.isArray(parsed)) {
    return {
      data: {
        items: parsed as Candidate[],
        totalCount: parsed.length,
      },
      page: 1,
      pageSize: requestedPageSize,
      totalCount: parsed.length,
      totalPages: 1,
    };
  }

  return {
    data: {
      items: [],
      totalCount: 0,
    },
    page: requestedPage,
    pageSize: requestedPageSize,
    totalCount: 0,
    totalPages: 1,
  };
}

/** Loads every candidate (one API page at a time, default page size). For bulk UIs e.g. email picker. */
export async function getAllCandidates(): Promise<Candidate[]> {
  let page = 1;
  const all: Candidate[] = [];

  for (;;) {
    const batch = await getCandidatesPage(page);
    all.push(...batch.data.items);
    if (page >= batch.totalPages || batch.data.items.length === 0) {
      break;
    }
    page += 1;
  }

  return all;
}

/** Alias for getAllCandidates — keeps existing call sites working. */
export async function getCandidates(): Promise<Candidate[]> {
  return getAllCandidates();
}

export async function getCandidateById(id: number): Promise<Candidate> {
  const res = await fetch(`${CANDIDATES_URL}/${id}`, { headers: authHeaders() });
  return readJsonResponse<Candidate>(res, "Candidate not found");
}

export async function createCandidate(email: string) {
  const res = await fetch(CANDIDATES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ email: email.trim() }),
  });

  return readJsonResponse<{ id: number; email: string; message: string }>(
    res,
    "Failed to create candidate"
  );
}


// -----------------------------------
// DELETE
// -----------------------------------
export async function deleteCandidate(id: number) {
  const res = await fetch(`${CANDIDATES_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return readJsonResponse<boolean>(res, "Delete failed");
}

// =============================================================================
// EXAM REVIEW (admin — requires auth)
// =============================================================================

export async function getCandidateExamReview(id: number): Promise<CandidateExamReview> {
  const res = await fetch(`${CANDIDATES_URL}/${id}/exam-review`, {
    headers: authHeaders(),
    cache: "no-store",
  });

  const raw = await readJsonResponse<{
    candidateId?: number;
    candidateName?: string;
    candidateEmail?: string; // ✅ ADD THIS
    examTitle?: string;
    finalScore?: number | null;
    questions?: Array<{
      questionId?: number;
      questionText?: string;
      questionImage?: string | null;
      selectedChoiceId?: number | null;
      choices?: Array<{
        id?: number;
        text?: string;
        isCorrect?: boolean;
        choiceId?: number;
        choiceText?: string;
        isSelectedByCandidate?: boolean;
      }>;
    }>;
  }>(res, "Failed to load exam review");

return {
  candidateId: raw.candidateId ?? id,
  candidateName: raw.candidateName ?? "",
  candidateEmail: raw.candidateEmail ?? "", // ✅ ADD THIS
  examTitle: raw.examTitle ?? "Exam review",
  finalScore: raw.finalScore ?? null,
  questions: (raw.questions ?? []).map((question) => ({
    questionId: question.questionId ?? 0,
    questionText: question.questionText ?? "",
    questionImage: question.questionImage ?? null,
    selectedChoiceId: question.selectedChoiceId ?? null,
    isCorrect: (question.choices ?? []).some((choice) => {
      const choiceId = choice.choiceId ?? choice.id ?? 0;
      return Boolean(choice.isCorrect) && choiceId === (question.selectedChoiceId ?? null);
    }),
    choices: (question.choices ?? []).map((choice) => {
      const choiceId = choice.choiceId ?? choice.id ?? 0;
      return {
        id: choiceId,
        text: choice.choiceText ?? choice.text ?? "",
        isCorrect: Boolean(choice.isCorrect),
      };
    }),
  })),
};
}

// =============================================================================
// CANDIDATE-FACING EXAM FLOW (no auth — token-based)
// =============================================================================

/** Completes a candidate's profile using their invite token. */
export async function completeCandidateProfile(token: string, body: any) {
  try {
    const res = await fetch(`${CANDIDATES_URL}/complete-profile/${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    return { ok: res.ok, status: res.status, raw: text };
  } catch (err) {
    return { ok: false, status: 0, raw: "NETWORK ERROR (backend not reachable or blocked)" };
  }
}

/** Fetches the exam page data for a candidate using their invite token. */
export async function getExamPageData(token: string) {
  return safeFetch(`${CANDIDATES_URL}/exam-page/${token}`, { method: "GET" });
}

/** Starts the exam for a candidate using their invite token. */
export async function startExam(token: string) {
  return safeFetch(`${CANDIDATES_URL}/start-exam/${token}`, { method: "POST" });
}
