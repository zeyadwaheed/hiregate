"use client";

type CandidateExamFilterOption = {
  id: number;
  title: string;
};

type Props = {
  value: number | null;
  exams: CandidateExamFilterOption[];
  loading?: boolean;
  onChange: (value: number | null) => void;
};

export function CandidateExamFilter({
  value,
  exams,
  loading = false,
  onChange,
}: Props) {
  return (
    <select
      value={value ?? "All"}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === "All" ? null : Number(next));
      }}
      disabled={loading}
      className="
        rounded-lg
        border
        border-slate-300
        bg-white
        px-4
        py-2.5
        text-sm
        text-slate-900
        outline-none
        disabled:cursor-not-allowed
        disabled:bg-slate-100
        disabled:text-slate-500
      "
    >
      <option value="All">All Exams</option>
      {exams.map((exam) => (
        <option key={exam.id} value={exam.id}>
          {exam.title}
        </option>
      ))}
    </select>
  );
}
