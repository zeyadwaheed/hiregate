import { Topic } from "@/app/_lib/question-bank.types";

const API_BASE_URL = "http://localhost:5116/api/admin";

const getAuthHeaders = (includeJson = false): HeadersInit => ({
  ...(includeJson ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${window.localStorage.getItem("token")}`,
});

export const topicService = {
  async getTopics(): Promise<Topic[]> {
    const response = await fetch(`${API_BASE_URL}/topics`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch topics");
    }

    return response.json();
  },

  async addTopic(topicName: string): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}/topics`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ topicName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to add topic");
    }

    return response.json();
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

  async updateTopic(topicId: number, topicName: string): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ topicName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update topic");
    }

    return response.json();
  },
};
