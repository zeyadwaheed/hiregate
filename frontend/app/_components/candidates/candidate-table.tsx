"use client";

import {
  Eye,
  Loader,
  Mail,
  Trash2,
  BookOpen,
} from "lucide-react";

import { Candidate } from "@/app/_services/candidate-service";

interface CandidateTableProps {
  candidates: Candidate[];
  loading: boolean;

  getStatus: (candidate: Candidate) => string;

  onView: (candidate: Candidate) => void;
  onDelete: (candidate: Candidate) => void;
  onSendEmail: (candidate: Candidate) => void;

  onShowExam: (candidateId: number) => void;
}

export function CandidateTable({
  candidates,
  loading,
  getStatus,
  onView,
  onDelete,
  onSendEmail,
  onShowExam,
}: CandidateTableProps) {

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-green-100 text-green-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">

          {/* HEADER */}
<thead className="bg-slate-100 border-b border-slate-200">
  <tr>
    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
      Name
    </th>

    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
      Email
    </th>

    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
      Score
    </th>

    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
      Status
    </th>

    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
      Actions
    </th>
  </tr>
</thead>

          {/* BODY */}
          <tbody className="divide-y divide-slate-200">

            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <div className="flex justify-center items-center gap-2">
                    <Loader className="animate-spin" size={20} />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No candidates found
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => {
                const status = getStatus(candidate);

                return (
                  <tr key={candidate.id} className="hover:bg-slate-50">

                    <td className="px-6 py-4 font-medium">
                      {candidate.firstName} {candidate.lastName}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {candidate.email}
                    </td>

                    <td className="px-6 py-4">
                      {candidate.finalScore ?? "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(status)}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">

                        <button
                          onClick={() => onView(candidate)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => onShowExam(candidate.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        >
                          <BookOpen size={16} />
                        </button>

                        <button
                          onClick={() => onSendEmail(candidate)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer"
                        >
                          <Mail size={16} />
                        </button>

                        <button
                          onClick={() => onDelete(candidate)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>
      </div>
    </div>
  );
}