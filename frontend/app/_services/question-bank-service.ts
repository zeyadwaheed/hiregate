import {
  PaginationData,
  QuestionDeletedFilter,
  QuestionFormData,
} from "@/app/_lib/question-bank.types";

const BACKEND_BASE_URL = "http://localhost:5116";
const API_BASE_URL = `${BACKEND_BASE_URL}/api/admin`;

const resolveQuestionImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) {
    return undefined;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  return imageUrl.startsWith("/")
    ? `${BACKEND_BASE_URL}${imageUrl}`
    : `${BACKEND_BASE_URL}/${imageUrl}`;
};

const getAuthHeaders = (includeJson = false): HeadersInit => ({
  ...(includeJson ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${window.localStorage.getItem("token")}`,
});




export const questionBankService = {
  async getQuestions(
    page: number,
    pageSize: number,
    selectedTopic: string,
    searchTerm: string,
    deletedFilter: QuestionDeletedFilter = "active"
  ): Promise<PaginationData> {
    const topicId = selectedTopic !== "all" ? Number(selectedTopic) : null;
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      deletedFilter,
      ...(topicId ? { topicId: topicId.toString() } : {}),
      ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
    });

    const response = await fetch(`${API_BASE_URL}/questions?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch questions");
    }
    const data: PaginationData = await response.json();

    return {
      ...data,
      data: data.data.map((question) => ({
        ...question,
        questionImage: resolveQuestionImageUrl(question.questionImage),
      })),
    };
  },

  async saveQuestion(
    formData: QuestionFormData,
    isEditingMode: boolean,
    questionId?: number
  ): Promise<void> {
    const payload = {
      topicId: Number(formData.topicId),
      questionText: formData.questionText,
      questionImage: formData.imageUrl || null,
      choices: formData.choices.map((choice) => ({
        choiceText: choice.choiceText,
        isCorrect: choice.isCorrect,
      })),
    };

    const url = isEditingMode
      ? `${API_BASE_URL}/questions/${questionId}`
      : `${API_BASE_URL}/questions`;

    const response = await fetch(url, {
      method: isEditingMode ? "PUT" : "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save question");
    }
  },

  async deleteQuestion(questionId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete question");
    }
  },

  async restoreQuestion(questionId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}/restore`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        typeof errorData === "object" && errorData && "message" in errorData
          ? String((errorData as { message?: string }).message)
          : undefined;
      throw new Error(message || "Failed to restore question");
    }
  },

  async addTopic(topicName: string): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}/topics`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ topicName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add topic");
    }

    return response.json();
  },

  async uploadQuestionImage(file: File): Promise<{ imageUrl: string }> {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch(`${API_BASE_URL}/questions/upload-image`, {
      method: "POST",
      headers: getAuthHeaders(), // no Content-Type — browser sets multipart boundary automatically
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        typeof errorData === "object" && errorData && "message" in errorData
          ? String((errorData as { message?: string }).message)
          : undefined;
      throw new Error(message || "Failed to upload image");
    }

    const data: { imageUrl: string } = await response.json();

    return {
      imageUrl: resolveQuestionImageUrl(data.imageUrl) ?? data.imageUrl,
    };
  },

  async deleteTopic(topicId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        typeof errorData === "object" && errorData && "message" in errorData
          ? String((errorData as { message?: string }).message)
          : undefined;
      throw new Error(message || "Failed to delete topic");
    }
  },
};

export { resolveQuestionImageUrl };
