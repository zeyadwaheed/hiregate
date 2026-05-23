using FluentValidation;
using HireGate.Service.DTOs;

namespace HireGate.Service.Validators
{
    public class PatchQuestionDtoValidator : AbstractValidator<PatchQuestionDto>
    {
        private const int MinChoices = 2;
        private const int MaxChoices = 4;

        public PatchQuestionDtoValidator()
        {
            When(x => x.QuestionText != null, () =>
            {
                RuleFor(x => x.QuestionText).NotEmpty().WithMessage("Question text cannot be empty").MaximumLength(200);
            });

            When(x => x.TopicId.HasValue, () =>
            {
                RuleFor(x => x.TopicId).Must(id => id > 0).WithMessage("Valid topic ID is required");
            });

            When(x => x.QuestionImage != null, () =>
            {
                RuleFor(x => x.QuestionImage)
                    .NotEmpty().WithMessage("Question image cannot be empty")
                    .Must(QuestionImageValidation.IsValid)
                    .WithMessage("Question image must be a valid URL or app-relative path");
            });

            When(x => x.Choices != null, () =>
            {
                RuleFor(x => x.Choices)
                    .NotEmpty().WithMessage("Choices are required")
                    .Must(list => list.Count >= MinChoices && list.Count <= MaxChoices)
                    .WithMessage($"Number of choices must be between {MinChoices} and {MaxChoices}");

                RuleForEach(x => x.Choices).ChildRules(choice =>
                {
                    choice.RuleFor(c => c.ChoiceText).NotEmpty().WithMessage("Choice text is required for all choices");
                    choice.RuleFor(c => c.IsCorrect).NotNull().WithMessage("IsCorrect is required for all choices");
                });

                RuleFor(x => x.Choices)
                    .Must(list => list.Count(c => c.IsCorrect == true) == 1)
                    .WithMessage("Exactly one choice must be marked as correct");
            });
        }
    }
}
