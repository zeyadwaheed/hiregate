using HireGate.Data.Models;
using HireGate.Service.DTOs;

namespace HireGate.Service.Mappers
{
    public static class ExamMapper
    {
        // Mapping Exam entity to ExamDto
        public static ExamListDto ToListDto(Exam e)
        {
            return new ExamListDto
            {
                Id = e.Id,
                PositionTitle = e.PositionTitle!,
                Mode = ToModeString(e.Mode),
                DurationMinutes = e.DurationMinutes,
                QuestionCount = e.QuestionCount,
                WindowStartTime = e.WindowStartTime,
                WindowEndTime = e.WindowEndTime
            };
        }

        public static ExamDto ToDto(Exam e)
        {
            return new ExamDto
            {
                Id = e.Id,
                PositionTitle = e.PositionTitle!,
                Mode = ToModeString(e.Mode),
                DurationMinutes = e.DurationMinutes,
                QuestionCount = e.QuestionCount,
                WindowStartTime = e.WindowStartTime,
                WindowEndTime = e.WindowEndTime,

                Questions = e.ExamQuestions?
                    .Where(eq => eq.Question != null)
                    .Select(eq => ToQuestionDto(eq.Question))
                    .ToList() ?? new List<QuestionDto>(),

                TopicRules = e.TopicRules?
                    .Select(ToTopicRuleDto)
                    .ToList() ?? new List<ExamTopicRuleDto>()
            };
        }

        public static ExamDto ToDto(Exam e, IEnumerable<Question> questions)
        {
            return new ExamDto
            {
                Id = e.Id,
                PositionTitle = e.PositionTitle!,
                Mode = ToModeString(e.Mode),
                DurationMinutes = e.DurationMinutes,
                QuestionCount = e.QuestionCount,
                WindowStartTime = e.WindowStartTime,
                WindowEndTime = e.WindowEndTime,
                Questions = questions
                    .Select(ToQuestionDto)
                    .ToList(),
                TopicRules = e.TopicRules?
                    .Select(ToTopicRuleDto)
                    .ToList() ?? new List<ExamTopicRuleDto>()
            };
        }

        public static ExamTopicRuleDto ToTopicRuleDto(ExamTopicRule rule)
        {
            return new ExamTopicRuleDto
            {
                Id = rule.Id,
                TopicId = rule.TopicId,
                TopicName = rule.Topic?.TopicName ?? string.Empty,
                QuestionCount = rule.QuestionCount
            };
        }

        public static string ToModeString(ExamMode mode)
            => mode.ToString().ToLower();

        // Helper method to map Question entity to QuestionDto
        public static QuestionDto ToQuestionDto(Question q)
        {
            return new QuestionDto
            {
                Id = q.Id,
                TopicId = q.TopicId,
                TopicName = q.Topic?.TopicName ?? string.Empty,
                QuestionText = q.QuestionText!,
                QuestionImage = q.QuestionImage,

                Choices = q.Choices?
                    .Select(c => new ChoiceDto
                    {
                        Id = c.Id,
                        QuestionId = c.QuestionId,
                        ChoiceText = c.ChoiceText!,
                        IsCorrect = c.IsCorrect
                    })
                    .ToList() ?? new List<ChoiceDto>()
            };
        }


        // transforming DTO back to Entity (for Create/Update operations)
        // takes the input and transfer it into db model
        public static Exam ToEntity(CreateExamDto dto)
        {
            return new Exam
            {
                PositionTitle = dto.PositionTitle,
                Mode = ParseMode(dto.Mode),
                DurationMinutes = dto.DurationMinutes,
                WindowStartTime = dto.WindowStartTime,
                WindowEndTime = dto.WindowEndTime,
                ExamQuestions = new List<ExamQuestion>()
            };
        }

        public static ExamMode ParseMode(string? mode)
        {
            return mode?.Trim().ToLowerInvariant() switch
            {
                null or "" or "static" => ExamMode.Static,
                "dynamic" => ExamMode.Dynamic,
                "hybrid" => ExamMode.Hybrid,
                _ => throw new ArgumentException("Invalid exam mode.", nameof(mode))
            };
        }
    }
}
