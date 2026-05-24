export type BackendQuestionDto = {
  id: number;
  topicId: number | null;
  topicName: string;
  questionText: string;
  questionImage: string | null;
  choices: Array<{
    id: number;
    choiceText: string;
    isCorrect: boolean;
  }>;
};

export type ExamMode = "static" | "dynamic" | "hybrid";

export type ExamTopicRule = {
  id?: number;
  topicId: number;
  topicName?: string;
  questionCount: number;
};

export type BackendExamDto = {
  id: number;
  positionTitle: string;
  mode?: ExamMode;
  durationMinutes: number | null;
  questionCount: number;
  windowStartTime: string | null;
  windowEndTime: string | null;
  questions: BackendQuestionDto[] | null;
  topicRules?: ExamTopicRule[] | null;
};

export type ExamSummary = {
  id: number;
  positionTitle: string;
  mode: ExamMode;
  durationMinutes?: number | null;
  questionCount: number;
  windowStartTime?: string | null;
  windowEndTime?: string | null;
};

export type Exam = {
  id: number;
  title: string;
  description: string;
  mode: ExamMode;
  duration: string;
  durationMinutes?: number;
  questionCount: number;
  windowStartTime?: string;
  windowEndTime?: string;
  questionIds: number[];
  questions: BackendQuestionDto[];
  topicRules: ExamTopicRule[];
};

export type CreateExamPayload = {
  positionTitle: string;
  mode: ExamMode;
  durationMinutes?: number | null;
  windowStartTime?: string | null;
  windowEndTime?: string | null;
  questionIds?: number[];
  topicRules?: Array<{
    topicId: number;
    questionCount: number;
  }>;
};

export type UpdateExamPayload = {
  positionTitle?: string;
  mode?: ExamMode;
  durationMinutes?: number | null;
  windowStartTime?: string | null;
  windowEndTime?: string | null;
  questionIds?: number[];
  addedQuestionIds?: number[];
  removedQuestionIds?: number[];
  topicRules?: Array<{
    topicId: number;
    questionCount: number;
  }>;
};

export type ExamsPaginatedResponse = {
  data: ExamSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
