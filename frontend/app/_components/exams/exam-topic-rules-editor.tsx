"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/_components/ui/button";
import Input from "@/app/_components/ui/input";
import type { ExamTopicRule } from "@/app/_lib/exams/exam.types";
import type { Topic } from "@/app/_lib/question-bank.types";
import { topicService } from "@/app/_services/topic-service";

type ExamTopicRulesEditorProps = {
  rules: ExamTopicRule[];
  onChange: (rules: ExamTopicRule[]) => void;
};

export default function ExamTopicRulesEditor({ rules, onChange }: ExamTopicRulesEditorProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadTopics() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await topicService.getTopics();
        if (isActive) {
          setTopics(data);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load topics");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadTopics();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedTopicIds = useMemo(() => new Set(rules.map((rule) => rule.topicId)), [rules]);

  function addRule() {
    const topic = topics.find((item) => !selectedTopicIds.has(item.id));
    if (!topic) {
      return;
    }

    onChange([
      ...rules,
      {
        topicId: topic.id,
        topicName: topic.topicName,
        questionCount: 1,
      },
    ]);
  }

  function updateRule(index: number, patch: Partial<ExamTopicRule>) {
    onChange(
      rules.map((rule, currentIndex) =>
        currentIndex === index
          ? {
              ...rule,
              ...patch,
            }
          : rule,
      ),
    );
  }

  function updateTopic(index: number, topicId: number) {
    const topic = topics.find((item) => item.id === topicId);
    updateRule(index, {
      topicId,
      topicName: topic?.topicName ?? "",
    });
  }

  function removeRule(index: number) {
    onChange(rules.filter((_, currentIndex) => currentIndex !== index));
  }

  const canAddRule = topics.some((topic) => !selectedTopicIds.has(topic.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Topic rules</p>
          <p className="text-sm text-slate-500">Choose topics and how many questions to draw from each.</p>
        </div>
        <Button type="button" variant="secondary" onClick={addRule} disabled={isLoading || !canAddRule}>
          <Plus size={16} />
          Add rule
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">Loading topics...</div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
      ) : rules.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          No topic rules added.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => {
            const unavailableTopicIds = new Set(
              rules
                .filter((_, currentIndex) => currentIndex !== index)
                .map((currentRule) => currentRule.topicId),
            );

            return (
              <div key={`${rule.topicId}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_160px_auto]">
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={rule.topicId || ""}
                  onChange={(event) => updateTopic(index, Number(event.target.value))}
                >
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id} disabled={unavailableTopicIds.has(topic.id)}>
                      {topic.topicName}
                    </option>
                  ))}
                </select>

                <Input
                  type="number"
                  min={1}
                  value={rule.questionCount}
                  onChange={(event) =>
                    updateRule(index, {
                      questionCount: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  aria-label="Question count"
                />

                <Button type="button" variant="secondary" onClick={() => removeRule(index)} aria-label="Remove topic rule">
                  <Trash2 size={16} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
