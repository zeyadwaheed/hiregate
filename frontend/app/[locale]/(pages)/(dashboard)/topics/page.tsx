"use client";

import { AlertMessage } from "@/app/_components/question-bank/alert-message";
import { AddTopicModal } from "@/app/_components/question-bank/add-topic-modal";
import { DeleteConfirmationModal } from "@/app/_components/question-bank/delete-confirmation-modal";
import { TopicsTable } from "@/app/_components/question-bank/topics-table";
import { useTopicBank } from "@/app/_hooks/use-topic-bank";
import { Plus } from "lucide-react";

export default function TopicBankPage() {
  const {
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
    isEditingTopic,
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
  } = useTopicBank();

  return (
    <div className="space-y-6">
      <AlertMessage
        type="success"
        message={successMessage}
        visible={isSuccessVisible}
        onClose={() => setSuccessMessage(null)}
      />
      <AlertMessage
        type="error"
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Topics</h2>
          <p className="mt-1 text-gray-600">Manage the topics used across question bank and exams</p>
        </div>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 sm:w-auto sm:px-6 sm:py-3 cursor-pointer"
          onClick={openAddTopicModal}
          disabled={loading}
        >
          <Plus size={20} />
          Add Topic
        </button>
      </div>

      <TopicsTable
        topics={topics}
        loading={loading}
        onEdit={openEditTopicModal}
        onDelete={setDeleteTopic}
      />

      <AddTopicModal
        isOpen={isTopicModalOpen}
        loading={loading}
        topicName={topicName}
        topicError={topicError}
        isEditing={isEditingTopic}
        onClose={closeAddTopicModal}
        onSubmit={submitTopic}
        onTopicNameChange={setTopicName}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteTopic}
        loading={loading}
        title="Delete Topic"
        description="Are you sure you want to delete this topic? Questions that use it may be affected."
        itemLabel={deleteTopic?.topicName}
        onCancel={() => setDeleteTopic(null)}
        onConfirm={confirmDeleteTopic}
      />
    </div>
  );
}
