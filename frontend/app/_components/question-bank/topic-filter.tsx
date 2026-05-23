"use client";

import { Topic } from "@/app/_lib/question-bank.types";
import { ChevronDown, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TopicFilterProps {
  topics: Topic[];
  selectedTopic: string;
  onSelect: (topicId: string) => void;
  onRequestDeleteTopic?: (topic: Topic) => void;
}

export function TopicFilter({
  topics,
  selectedTopic,
  onSelect,
  onRequestDeleteTopic,
}: TopicFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedTopicEntity =
    selectedTopic === "all"
      ? null
      : topics.find((t) => t.id.toString() === selectedTopic) ?? null;

  const displayLabel =
    selectedTopic === "all" ? "All topics" : selectedTopicEntity?.topicName ?? "All topics";

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (topicId: string) => {
    onSelect(topicId);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <span id="topic-filter-label" className="mb-1 block text-sm font-medium text-gray-600">
        Topic
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="topic-filter-label"
        aria-controls="topic-filter-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-900 shadow-sm transition-colors hover:bg-gray-50 sm:text-base cursor-pointer"
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id="topic-filter-menu"
          role="listbox"
          aria-labelledby="topic-filter-label"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg cursor-pointer"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={selectedTopic === "all"}
              onClick={() => pick("all")}
              className={`flex w-full items-center px-3 py-2.5 text-left text-sm sm:text-base cursor-pointer   ${
                selectedTopic === "all"
                  ? "bg-blue-50 font-medium text-blue-800"
                  : "text-gray-800 hover:bg-gray-50"
              }`}
            >
              All topics
            </button>
          </li>
          {topics.map((topic) => {
            const isSelected = selectedTopic === topic.id.toString();
            return (
              <li key={topic.id} role="presentation" className="flex items-stretch border-t border-gray-100 first:border-t-0  ">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => pick(topic.id.toString())}
                  className={`min-w-0 flex-1 px-3 py-2.5 text-left text-sm sm:text-base cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 font-medium text-blue-800"
                      : "text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <span className="block truncate">{topic.topicName}</span>
                </button>
                {onRequestDeleteTopic ? (
                  <button
                    type="button"
                    aria-label={`Delete topic ${topic.topicName}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRequestDeleteTopic(topic);
                      setOpen(false);
                    }}
                    className="flex shrink-0 items-center justify-center border-l border-gray-100 px-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 sm:px-3"
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
