import { FormEvent, useEffect, useState } from "react";
import { Topic } from "@/app/_lib/question-bank.types";
import { topicService } from "@/app/_services/topic-service";

export const useTopicBank = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [topicError, setTopicError] = useState<string | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [deleteTopic, setDeleteTopic] = useState<Topic | null>(null);
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadTopics = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await topicService.getTopics();
      setTopics(data);
      setTotalPages(1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

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

  const openAddTopicModal = () => {
    setTopicName("");
    setTopicError(null);
    setEditTopic(null);
    setIsTopicModalOpen(true);
  };

  const closeAddTopicModal = () => {
    setIsTopicModalOpen(false);
    setTopicName("");
    setTopicError(null);
    setEditTopic(null);
  };

  const openEditTopicModal = (topic: Topic) => {
    setEditTopic(topic);
    setTopicName(topic.topicName);
    setTopicError(null);
    setIsTopicModalOpen(true);
  };

  const submitTopic = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedTopicName = topicName.trim();
    if (!normalizedTopicName) {
      setTopicError("Topic name is required.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setTopicError(null);
    try {
      if (editTopic) {
        const updated = await topicService.updateTopic(editTopic.id, normalizedTopicName);
        setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSuccessMessage("Topic updated successfully.");
      } else {
        const created = await topicService.addTopic(normalizedTopicName);
        setTopics((prev) => [...prev, created]);
        setSuccessMessage("Topic added successfully.");
      }
      setCurrentPage(1);
      closeAddTopicModal();
    } catch (error) {
      setTopicError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTopic = async () => {
    if (!deleteTopic) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await topicService.deleteTopic(deleteTopic.id);
      setTopics((prev) => prev.filter((t) => t.id !== deleteTopic.id));
      setDeleteTopic(null);
      setSuccessMessage("Topic deleted successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    topics,
    loading,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    isSuccessVisible,
    topicName,
    setTopicName,
    topicError,
    isEditingTopic: !!editTopic,
    isTopicModalOpen,
    openAddTopicModal,
    closeAddTopicModal,
    submitTopic,
    openEditTopicModal,
    deleteTopic,
    setDeleteTopic,
    confirmDeleteTopic,
    currentPage,
    setCurrentPage,
    totalPages,
  };
};
