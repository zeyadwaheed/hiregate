using HireGate.Data.Models;
using HireGate.Repository.Interfaces;
using HireGate.Service.DTOs;
using HireGate.Service.Interfaces;
using HireGate.Service.Mappers;
using HireGate.Service.Exceptions;

namespace HireGate.Service.Implementations
{
    public class ExamService : IExamService
    {
        private readonly IExamRepository _examRepository;
        private readonly IExamQuestionRepository _examQuestionRepository;
        private readonly IQuestionRepository _questionRepository;
       // private readonly IDateTimeProvider _dateTimeProvider;

        public ExamService(
            IExamRepository examRepository,
            IExamQuestionRepository examQuestionRepository,
            IQuestionRepository questionRepository)
        {
            _examRepository = examRepository;
            _examQuestionRepository = examQuestionRepository;
            _questionRepository = questionRepository;
            //_dateTimeProvider = dateTimeProvider;
        }

        // ─────────────────────────────
        // GET ALL
        // ─────────────────────────────
        public async Task<(IEnumerable<ExamListDto> Exams, int TotalCount)> GetAllExamsAsync(int pageNumber, int pageSize, string? search = null)
        {
            var (exams, totalCount) = await _examRepository.GetAllExamsAsync(pageNumber, pageSize, search);
            return (exams.Select(ExamMapper.ToListDto), totalCount);
        }

        // ─────────────────────────────
        // GET BY ID
        // ─────────────────────────────
        public async Task<ExamDto?> GetExamByIdAsync(int id)
        {
            var exam = await _examRepository.GetExamByIdAsync(id);
            return exam is null ? null : ExamMapper.ToDto(exam);
        }

        // ─────────────────────────────
        // CREATE
        // ─────────────────────────────
        public async Task<ExamDto> CreateExamAsync(CreateExamDto dto)
        {
            var mode = ExamMapper.ParseMode(dto.Mode);
            var questionIds = UsesStaticQuestions(mode) ? (dto.QuestionIds ?? []).Distinct().ToList() : [];
            var topicRules = UsesTopicRules(mode) ? NormalizeTopicRules(dto.TopicRules) : [];
            ValidateModePayload(mode, questionIds, topicRules);

            var invalidIds = await _examQuestionRepository.GetNonExistentQuestionIdsAsync(questionIds);
            if (invalidIds.Any()) throw new InvalidQuestionIdsException(invalidIds);
            await ValidateTopicIdsAsync(topicRules);

            var exam = ExamMapper.ToEntity(dto);
            exam.Mode = mode;
            exam.QuestionCount = CalculateQuestionCount(questionIds, topicRules);
            _examRepository.CreateExam(exam);
            await _examRepository.SaveAsync();

            await _examRepository.ReplaceExamQuestionsAsync(exam.Id, questionIds);
            await _examRepository.ReplaceExamTopicRulesAsync(exam.Id, topicRules.Select(rule => new ExamTopicRule
            {
                TopicId = rule.TopicId,
                QuestionCount = rule.QuestionCount
            }));
            await _examRepository.SaveAsync();

            var created = await _examRepository.GetExamByIdAsync(exam.Id);
            return ExamMapper.ToDto(created!);
        }

        // ─────────────────────────────
        // UPDATE
        // ─────────────────────────────
        public async Task<ExamDto?> UpdateExamAsync(int id, UpdateExamDto dto)
        {
            var exam = await _examRepository.GetExamByIdForUpdateAsync(id);
            if (exam is null) return null;

            var mode = dto.Mode is null ? exam.Mode : ExamMapper.ParseMode(dto.Mode);
            var questionIds = UsesStaticQuestions(mode) ? ResolveUpdatedQuestionIds(exam, dto) : [];
            var topicRules = UsesTopicRules(mode) ? NormalizeTopicRules(dto.TopicRules ?? exam.TopicRules.Select(ExamMapper.ToTopicRuleDto)) : [];
            ValidateModePayload(mode, questionIds, topicRules);

            var invalidIds = await _examQuestionRepository.GetNonExistentQuestionIdsAsync(questionIds);
            if (invalidIds.Any()) throw new InvalidQuestionIdsException(invalidIds);
            await ValidateTopicIdsAsync(topicRules);

            if (dto.PositionTitle is not null) exam.PositionTitle = dto.PositionTitle;
            exam.Mode = mode;
            if (dto.DurationMinutes.HasValue) exam.DurationMinutes = dto.DurationMinutes;
            if (dto.WindowStartTime.HasValue) exam.WindowStartTime = dto.WindowStartTime;
            if (dto.WindowEndTime.HasValue) exam.WindowEndTime = dto.WindowEndTime;
            exam.QuestionCount = CalculateQuestionCount(questionIds, topicRules);

            await _examRepository.ReplaceExamQuestionsAsync(id, questionIds);
            await _examRepository.ReplaceExamTopicRulesAsync(id, topicRules.Select(rule => new ExamTopicRule
            {
                TopicId = rule.TopicId,
                QuestionCount = rule.QuestionCount
            }));

            await _examRepository.SaveAsync();

            var updated = await _examRepository.GetExamByIdAsync(id);
            return ExamMapper.ToDto(updated!);
        }

        // ─────────────────────────────
        // DELETE
        // ─────────────────────────────
        public async Task<bool> DeleteExamAsync(int id)
        {
            return await _examRepository.DeleteExamByIdAsync(id); // ✅ no loading, no tracking issues
        }
        // ─────────────────────────────
        // QUESTIONS MANAGEMENT
        // ─────────────────────────────
        public async Task<IEnumerable<Question>> GetExamQuestionsAsync(int examId)
            => await _examQuestionRepository.GetQuestionsAsync(examId);

        public async Task<bool> AddQuestionToExamAsync(int examId, int questionId)
        {
            if (!await _examQuestionRepository.ExamExistsAsync(examId)) return false;
            if (!await _examQuestionRepository.QuestionExistsAsync(questionId)) return false;
            if (await _examQuestionRepository.QuestionAlreadyInExamAsync(examId, questionId)) return false;

            _examQuestionRepository.AddQuestion(examId, questionId);
            await _examQuestionRepository.SaveAsync();
            await _examQuestionRepository.SyncExamQuestionCountAsync(examId);
            return true;
        }

        public async Task<bool> RemoveQuestionFromExamAsync(int examId, int questionId)
        {
            if (!await _examQuestionRepository.ExamExistsAsync(examId)) return false;

            bool result = await _examQuestionRepository.RemoveQuestionAsync(examId, questionId);
            if (!result) return false;

            await _examQuestionRepository.SaveAsync();
            await _examQuestionRepository.SyncExamQuestionCountAsync(examId);
            return true;
        }

        private static bool UsesStaticQuestions(ExamMode mode)
            => mode is ExamMode.Static or ExamMode.Hybrid;

        private static bool UsesTopicRules(ExamMode mode)
            => mode is ExamMode.Dynamic or ExamMode.Hybrid;

        private static List<int> ResolveUpdatedQuestionIds(Exam exam, UpdateExamDto dto)
        {
            if (dto.QuestionIds is not null)
            {
                return dto.QuestionIds.Distinct().ToList();
            }

            var questionIds = exam.ExamQuestions.Select(eq => eq.QuestionId).ToHashSet();

            foreach (var questionId in dto.RemovedQuestionIds ?? [])
                questionIds.Remove(questionId);

            foreach (var questionId in dto.AddedQuestionIds ?? [])
                questionIds.Add(questionId);

            return questionIds.ToList();
        }

        private static List<ExamTopicRuleDto> NormalizeTopicRules(IEnumerable<ExamTopicRuleDto>? rules)
        {
            return (rules ?? [])
                .GroupBy(rule => rule.TopicId)
                .Select(group => new ExamTopicRuleDto
                {
                    TopicId = group.Key,
                    QuestionCount = group.Sum(rule => rule.QuestionCount)
                })
                .ToList();
        }

        private static void ValidateModePayload(ExamMode mode, IReadOnlyCollection<int> questionIds, IReadOnlyCollection<ExamTopicRuleDto> topicRules)
        {
            if (UsesStaticQuestions(mode) && questionIds.Count == 0)
                throw new ArgumentException("Static exams must have at least one question.");

            if (UsesTopicRules(mode) && topicRules.Count == 0)
                throw new ArgumentException("Dynamic exams must have at least one topic rule.");
        }

        private async Task ValidateTopicIdsAsync(IEnumerable<ExamTopicRuleDto> topicRules)
        {
            var topicIds = topicRules.Select(rule => rule.TopicId).ToList();
            var invalidTopicIds = await _examRepository.GetNonExistentTopicIdsAsync(topicIds);
            if (invalidTopicIds.Any()) throw new InvalidTopicIdsException(invalidTopicIds);
        }

        private static int CalculateQuestionCount(IEnumerable<int> questionIds, IEnumerable<ExamTopicRuleDto> topicRules)
            => questionIds.Distinct().Count() + topicRules.Sum(rule => rule.QuestionCount);
    }
}
