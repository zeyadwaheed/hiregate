import { Edit2, Trash2, Loader, Tag } from "lucide-react";
import { Topic } from "@/app/_lib/question-bank.types";

interface TopicsTableProps {
  topics: Topic[];
  loading: boolean;
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
}

export function TopicsTable({ topics, loading, onEdit, onDelete }: TopicsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] border-b border-gray-200 bg-gray-50 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 sm:px-6 sm:py-4">
        <span>Topic</span>
        <span>Actions</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-3 py-8 text-gray-700 sm:px-6">
          <Loader size={20} className="animate-spin" />
          Loading topics...
        </div>
      ) : topics.length === 0 ? (
        <div className="px-3 py-8 text-center text-gray-500 sm:px-6">No topics found</div>
      ) : (
        <div className="divide-y divide-gray-200">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-3 py-3 transition-colors hover:bg-gray-50 sm:px-6 sm:py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                  <Tag size={16} aria-hidden />
                </span>
                <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                  {topic.topicName}
                </p>
              </div>

              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => onEdit(topic)}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit topic"
                >
                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => onDelete(topic)}
                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete topic"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
