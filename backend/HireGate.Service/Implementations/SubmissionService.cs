using HireGate.Data.Models;
using HireGate.Repository.Interfaces;
using HireGate.Service.DTOs;
using HireGate.Service.Interfaces;
using HireGate.Service.Exceptions;

namespace HireGate.Service.Implementations
{
    public class SubmissionService : ISubmissionService
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IQuestionRepository _questionRepository;
        private readonly IDateTimeProvider _dateTimeProvider;

        public SubmissionService(ISubmissionRepository submissionRepository, IQuestionRepository questionRepository, IDateTimeProvider dateTimeProvider)
        {
            _submissionRepository = submissionRepository;
            _questionRepository = questionRepository;
            _dateTimeProvider = dateTimeProvider;
        }

        public async Task SubmitExamAsync(SubmitExamDto dto)
        {
            var now = _dateTimeProvider.Now;

            var candidate = await GetCandidateOrThrowAsync(dto.Token);
            var exam = await ResolveExamAsync(candidate);

            ValidateWindowAndDuration(exam, candidate, now);

            var choiceIds = dto.Answers.Select(a => a.ChoiceId).Distinct();
            var choices = await _submissionRepository.GetChoicesByIdsAsync(choiceIds);

            var questionIds = dto.Answers.Select(a => a.QuestionId).Distinct();
            await ValidateQuestionIdsExistAsync(questionIds);

            if (!candidate.ExamId.HasValue)
                throw new InvalidOperationException("Candidate has no exam assigned");

            int examId = candidate.ExamId.Value;
            var examQuestions = await _submissionRepository.GetQuestionsAsync(examId);
            var examQuestionIds = examQuestions.Select(q => q.Id).ToHashSet();

            var (candidateAnswers, score) = BuildCandidateAnswers(dto.Answers, examQuestionIds, choices, candidate.Id, examId);

            _submissionRepository.AddCandidateAnswers(candidateAnswers);

            candidate.SubmittedAt = now;
            candidate.FinalScore = score;
            //candidate.Token = null;

            _submissionRepository.UpdateCandidate(candidate);
            await _submissionRepository.SaveAsync();
        }

        private async Task<Data.Models.Candidate> GetCandidateOrThrowAsync(string? token)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new InvalidOperationException("Token is required.");

            var candidate = await _submissionRepository.GetCandidateByTokenAsync(token!);
            if (candidate is null)
                throw new InvalidOperationException("Invalid token or candidate not found.");

            return candidate;
        }

        private async Task<Data.Models.Exam> ResolveExamAsync(Data.Models.Candidate candidate)
        {
            var exam = candidate.Exam;
            if (exam is null)
            {
                if (!candidate.ExamId.HasValue)
                    throw new InvalidOperationException("Candidate has no exam assigned.");

                exam = await _submissionRepository.GetExamByIdAsync(candidate.ExamId.Value);
                if (exam is null)
                    throw new InvalidOperationException("Assigned exam not found.");
            }

            return exam;
        }

        private void ValidateWindowAndDuration(Data.Models.Exam exam, Data.Models.Candidate candidate, DateTime now)
        {
            if (exam.WindowStartTime.HasValue && now < exam.WindowStartTime.Value)
            {
                throw new InvalidOperationException("Exam window has not started yet.");
            }

            if (exam.WindowEndTime.HasValue && now > exam.WindowEndTime.Value)
            {
                throw new InvalidOperationException("Exam window has expired.");
            }

            if (candidate.StartedAt.HasValue && exam.DurationMinutes.HasValue)
            {
                var elapsed = (now - candidate.StartedAt.Value).TotalMinutes;
                if (elapsed > (exam.DurationMinutes.Value + 5)) 
                {
                    throw new InvalidOperationException("Exam duration exceeded.");
                }
            }
        }

        private async Task ValidateQuestionIdsExistAsync(IEnumerable<int> questionIds)
        {
            foreach (var qid in questionIds)
            {
                if (!await _questionRepository.QuestionExistsAsync(qid))
                    throw new InvalidOperationException($"Question with id {qid} not found.");
            }
        }

        private (List<CandidateAnswer> Answers, int Score) BuildCandidateAnswers(IEnumerable<DTOs.QuestionAnswerDto> answers,
            HashSet<int> examQuestionIds,
            IDictionary<int, Data.Models.Choice> choices,
            int candidateId,
            int examId)
        {
            var candidateAnswers = new List<CandidateAnswer>();
            int score = 0;

            foreach (var a in answers)
            {
                if (!examQuestionIds.Contains(a.QuestionId))
                {
                    throw new InvalidOperationException($"Question with id {a.QuestionId} not found in the exam.");
                }

                if (!choices.TryGetValue(a.ChoiceId, out var choice))
                {
                    throw new InvalidOperationException($"Choice with id {a.ChoiceId} not found.");
                }

                if (choice.QuestionId != a.QuestionId)
                {
                    throw new InvalidOperationException($"Choice with id {a.ChoiceId} does not belong to question {a.QuestionId}.");
                }

                var isCorrect = choice.IsCorrect;
                if (isCorrect) score++;

                candidateAnswers.Add(new CandidateAnswer
                {
                    CandidateId = candidateId,
                    ExamId = examId,
                    QuestionId = a.QuestionId,
                    ChoiceId = a.ChoiceId,
                    IsCorrect = isCorrect
                });
            }

            return (candidateAnswers, score);
        }
    }
}
