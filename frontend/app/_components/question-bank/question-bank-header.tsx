import { Plus } from "lucide-react";

interface QuestionBankHeaderProps {
  loading: boolean;
  onAddQuestion: () => void;
}

export function QuestionBankHeader({
  loading,
  onAddQuestion,
}: QuestionBankHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Question Bank</h2>
        <p className="text-gray-600 mt-1">Manage your library of exam questions</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          onClick={onAddQuestion}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 w-full sm:w-auto cursor-pointer"
        >
          <Plus size={20} />
          Add Question
        </button>
      </div>
    </div>
  );
}
