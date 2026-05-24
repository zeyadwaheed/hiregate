using FluentValidation;
using HireGate.Service.DTOs;
namespace HireGate.Service.Validators
{
    public class CreateExamDtoValidator : AbstractValidator<CreateExamDto>
    {
        public CreateExamDtoValidator()
        {
            RuleFor(x => x.PositionTitle)
                .NotEmpty()
                .Length(3, 100);

            RuleFor(x => x.Mode)
                .NotEmpty()
                .Must(BeValidMode)
                .WithMessage("Mode must be one of: static, dynamic, hybrid.");

            RuleFor(x => x.DurationMinutes)
                .GreaterThan(0);

            RuleFor(x => x.WindowEndTime)
                .GreaterThan(x => x.WindowStartTime)
                .When(x => x.WindowStartTime.HasValue && x.WindowEndTime.HasValue);

            RuleFor(x => x.QuestionIds)
                .NotNull();

            RuleFor(x => x.QuestionIds)
                .NotEmpty()
                .When(x => UsesStaticQuestions(x.Mode))
                .WithMessage("At least one question ID is required.");

            RuleForEach(x => x.QuestionIds)
                .GreaterThan(0);

            RuleFor(x => x.QuestionIds)
                .Must(questionIds => questionIds.Distinct().Count() == questionIds.Count)
                .When(x => x.QuestionIds != null)
                .WithMessage("Question IDs must be unique.");

            RuleFor(x => x.TopicRules)
                .NotEmpty()
                .When(x => UsesTopicRules(x.Mode))
                .WithMessage("At least one topic rule is required.");

            RuleForEach(x => x.TopicRules).ChildRules(rule =>
            {
                rule.RuleFor(x => x.TopicId).GreaterThan(0);
                rule.RuleFor(x => x.QuestionCount).GreaterThan(0);
            });

            RuleFor(x => x.TopicRules)
                .Must(rules => rules.Select(rule => rule.TopicId).Distinct().Count() == rules.Count)
                .When(x => x.TopicRules != null)
                .WithMessage("Topic rules must be unique per topic.");
        }

        private static bool BeValidMode(string? mode)
            => mode?.Trim().ToLowerInvariant() is "static" or "dynamic" or "hybrid";

        private static bool UsesStaticQuestions(string? mode)
            => mode?.Trim().ToLowerInvariant() is "static" or "hybrid";

        private static bool UsesTopicRules(string? mode)
            => mode?.Trim().ToLowerInvariant() is "dynamic" or "hybrid";
    }
}
