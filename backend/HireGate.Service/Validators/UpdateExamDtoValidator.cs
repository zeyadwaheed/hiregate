using FluentValidation;
using HireGate.Service.DTOs;

namespace HireGate.Service.Validators
{
    public class UpdateExamDtoValidator : AbstractValidator<UpdateExamDto>
    {
        public UpdateExamDtoValidator()
        {
            RuleFor(x => x.PositionTitle)
                .NotEmpty()
                .Length(3, 100)
                .When(x => x.PositionTitle is not null);

            RuleFor(x => x.Mode)
                .Must(BeValidMode)
                .When(x => x.Mode is not null)
                .WithMessage("Mode must be one of: static, dynamic, hybrid.");

            RuleFor(x => x.DurationMinutes)
                .GreaterThan(0)
                .When(x => x.DurationMinutes.HasValue);

            RuleFor(x => x.WindowEndTime)
                .GreaterThan(x => x.WindowStartTime)
                .When(x => x.WindowStartTime.HasValue && x.WindowEndTime.HasValue);

            RuleForEach(x => x.QuestionIds)
                .GreaterThan(0)
                .When(x => x.QuestionIds is not null);

            RuleFor(x => x.QuestionIds)
                .Must(questionIds => questionIds is null || questionIds.Distinct().Count() == questionIds.Count)
                .When(x => x.QuestionIds is not null)
                .WithMessage("Question IDs must be unique.");

            RuleForEach(x => x.AddedQuestionIds)
                .GreaterThan(0)
                .When(x => x.AddedQuestionIds is not null);

            RuleForEach(x => x.RemovedQuestionIds)
                .GreaterThan(0)
                .When(x => x.RemovedQuestionIds is not null);

            RuleForEach(x => x.TopicRules).ChildRules(rule =>
            {
                rule.RuleFor(x => x.TopicId).GreaterThan(0);
                rule.RuleFor(x => x.QuestionCount).GreaterThan(0);
            });

            RuleFor(x => x.TopicRules)
                .Must(rules => rules is null || rules.Select(rule => rule.TopicId).Distinct().Count() == rules.Count)
                .When(x => x.TopicRules is not null)
                .WithMessage("Topic rules must be unique per topic.");
        }

        private static bool BeValidMode(string? mode)
            => mode?.Trim().ToLowerInvariant() is "static" or "dynamic" or "hybrid";
    }
}
