import {
  BackendExamDto,
  BackendQuestionDto,
  CreateExamPayload,
  Exam,
  ExamsPaginatedResponse,
  ExamSummary,
  UpdateExamPayload,
} from "../_lib/exams/exam.types";
import { ExamApiError } from "../_lib/errorHandling";


const DEFAULT_BACKEND_URL = "http://localhost:5116";

function getBackendBaseUrl() {
  return process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_URL;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildExamDescription(exam: BackendExamDto) {
  return `Assessment for ${exam.positionTitle} candidates.`;
}

// Mapping function to convert BackendExamDto to Exam for UI consumption
export function mapBackendExamToExam(exam: BackendExamDto): Exam {
  const questions = exam.questions ?? [];

  return {
    id: exam.id,
    title: exam.positionTitle,
    description: buildExamDescription(exam),
    duration: exam.durationMinutes ? `${exam.durationMinutes} minutes` : "No duration set",
    durationMinutes: exam.durationMinutes ?? undefined,
    questionCount: questions.length,
    windowStartTime: exam.windowStartTime ?? undefined,
    windowEndTime: exam.windowEndTime ?? undefined,
    questionIds: questions.map((question) => question.id),
    questions,
  };
}

async function fetchExamApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`,
   {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | Array<{ error?: string; field?: string }>
      | null;

    const message = Array.isArray(payload)
      ? payload.map((item) => item.error).filter(Boolean).join(", ")
      : payload?.error ?? payload?.message ?? `Exam API request failed with status ${response.status}`;

    throw new ExamApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function parseApiMessage(text: string, fallback: string) {
  if (!text.trim()) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text) as unknown;

    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      const message = record.message ?? record.error;

      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  } catch {
    return text;
  }

  return fallback;
}


export async function getExams(): Promise<Exam[]> {
    const result = await fetchExamApi<BackendExamDto[] | { data: BackendExamDto[] }>("/api/exam/");
    const exams = Array.isArray(result) ? result : result.data ?? [];
    return exams.map(mapBackendExamToExam);
}

export async function getExamTitles(): Promise<Pick<Exam, 'id' | 'title'>[]> {
    const result = await fetchExamApi<BackendExamDto[] | { data: BackendExamDto[] }>("/api/exam/");
    const exams = Array.isArray(result) ? result : result.data ?? [];
    return exams.map(exam => ({ id: exam.id, title: exam.positionTitle }));
}
export async function getExamsPage(
  page: number,
  search?: string,
): Promise<ExamsPaginatedResponse> {
  const params = new URLSearchParams({
    page: String(Math.max(1, page)),
  });
  const trimmed = search?.trim();
  if (trimmed) {
    params.set("search", trimmed);
  }

  const result = await fetchExamApi<{
    data: BackendExamDto[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }>(`/api/exam/?${params.toString()}`);

  return {
    data: (result.data ?? []).map((exam): ExamSummary => ({
    id: exam.id,
    positionTitle: exam.positionTitle,
    durationMinutes: exam.durationMinutes,
    questionCount: exam.questionCount,
    windowStartTime: exam.windowStartTime,
    windowEndTime: exam.windowEndTime,
      
    })),
    page: result.page,
    pageSize: result.pageSize,
    totalCount: result.totalCount,
    totalPages: result.totalPages,
  };
}

export async function getExamById(examId: number): Promise<Exam> {
  const exam = await fetchExamApi<BackendExamDto>(`/api/exam/${examId}`);
  return mapBackendExamToExam(exam);  
}

export async function createExam(payload: CreateExamPayload): Promise<Exam> {
  const exam = await fetchExamApi<BackendExamDto>("/api/exam/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return mapBackendExamToExam(exam);
}

export async function updateExam(examId: number, payload: UpdateExamPayload): Promise<Exam> {
  const exam = await fetchExamApi<BackendExamDto>(`/api/exam/${examId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return mapBackendExamToExam(exam);
}

export async function deleteExam(examId: number): Promise<void> {
  await fetchExamApi<void>(`/api/exam/${examId}`, {
    method: "DELETE",
  });
}

export async function getExamQuestions(examId: number): Promise<BackendQuestionDto[]> {
  return fetchExamApi<BackendQuestionDto[]>(`/api/exam/${examId}/questions`);
}

export async function addQuestionToExam(examId: number, questionId: number): Promise<void> {
  await fetchExamApi(`/api/exam/${examId}/questions/${questionId}`, {
    method: "POST",
  });
}

export async function removeQuestionFromExam(examId: number, questionId: number): Promise<void> {
  await fetchExamApi(`/api/exam/${examId}/questions/${questionId}`, {
    method: "DELETE",
  });
}

export async function sendExamEmail(candidateId: number, examId: number): Promise<string> {
  const response = await fetch(`${getBackendBaseUrl()}/candidates/${candidateId}/send-exam-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ examId }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(parseApiMessage(text, "Failed to send exam email"));
  }

  return parseApiMessage(text, "Email sent successfully.");
}

export async function sendBulkExamEmail(data: {
  examId: number;
  candidateIds: number[];
}): Promise<string> {
  const response = await fetch(`${getBackendBaseUrl()}/candidates/send-bulk-exam-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(parseApiMessage(text, "Bulk email failed"));
  }

  return parseApiMessage(text, "Bulk emails sent successfully.");
}
