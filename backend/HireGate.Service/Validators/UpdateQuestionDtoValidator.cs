using FluentValidation;
using HireGate.Service.DTOs;

namespace HireGate.Service.Validators
{
    public class UpdateQuestionDtoValidator : AbstractValidator<UpdateQuestionDto>
    {
        private const int MinChoices = 2;
        private const int MaxChoices = 4;

        public UpdateQuestionDtoValidator()
        {
            RuleFor(x => x.QuestionText)
                .NotEmpty().WithMessage("Question text is required")
                .MaximumLength(200);

            RuleFor(x => x.TopicId)
                .Must(id => !id.HasValue || id.Value > 0)
                .WithMessage("Valid topic ID is required");

            RuleFor(x => x.Choices)
                .NotNull().WithMessage("Choices are required")
                .Must(list => list.Count >= MinChoices && list.Count <= MaxChoices)
                .WithMessage($"Number of choices must be between {MinChoices} and {MaxChoices}");

            RuleForEach(x => x.Choices).ChildRules(choice =>
            {
                choice.RuleFor(c => c.ChoiceText).NotEmpty().WithMessage("Choice text is required");
            });

            RuleFor(x => x.Choices)
                .Must(list => list.Count(c => c.IsCorrect) == 1)
                .WithMessage("Exactly one choice must be marked as correct");

            RuleFor(x => x.QuestionImage)
                .Must(QuestionImageValidation.IsValid)
                .WithMessage("Question image must be a valid URL or app-relative path");
        }
    }
}
