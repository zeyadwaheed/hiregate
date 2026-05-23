using FluentAssertions;
using HireGate.Service.DTOs;
using HireGate.Service.Validators;

namespace HireGate.Service.Tests
{
    public class QuestionImageValidatorTests
    {
        [Fact]
        public void CreateQuestionValidator_ShouldAccept_AppRelativeImagePath()
        {
            var validator = new CreateQuestionDtoValidator();
            var dto = new CreateQuestionDto
            {
                QuestionText = "Question",
                TopicId = 1,
                QuestionImage = "/images/questions/test-image.jpg",
                Choices = new List<CreateChoiceDto>
                {
                    new() { ChoiceText = "A", IsCorrect = true },
                    new() { ChoiceText = "B", IsCorrect = false }
                }
            };

            var result = validator.Validate(dto);

            result.IsValid.Should().BeTrue();
        }

        [Fact]
        public void UpdateQuestionValidator_ShouldReject_InvalidRelativeImagePath()
        {
            var validator = new UpdateQuestionDtoValidator();
            var dto = new UpdateQuestionDto
            {
                QuestionText = "Question",
                TopicId = 1,
                QuestionImage = "images/questions/test-image.jpg",
                Choices = new List<UpdateChoiceDto>
                {
                    new() { ChoiceText = "A", IsCorrect = true },
                    new() { ChoiceText = "B", IsCorrect = false }
                }
            };

            var result = validator.Validate(dto);

            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain(error => error.PropertyName == nameof(UpdateQuestionDto.QuestionImage));
        }

        [Fact]
        public void PatchQuestionValidator_ShouldAccept_AbsoluteImageUrl()
        {
            var validator = new PatchQuestionDtoValidator();
            var dto = new PatchQuestionDto
            {
                QuestionImage = "https://example.com/images/question.jpg"
            };

            var result = validator.Validate(dto);

            result.IsValid.Should().BeTrue();
        }
    }
}
