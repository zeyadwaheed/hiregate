using System.ComponentModel.DataAnnotations;
namespace HireGate.Data.Models;
public class Question
{
    [Key]
    public int Id { get; set; }

    public int? TopicId { get; set; }
    public Topic? Topic { get; set; }

    public string QuestionText { get; set; } = null!;

    public string? QuestionImage { get; set; }
    public DateTime? DeletedAt { get; set; } = null;
    
    public ICollection<Choice> Choices { get; set; } = new List<Choice>();
    public ICollection<ExamQuestion> ExamQuestions { get; set; } = new List<ExamQuestion>();
    public ICollection<CandidateExamQuestion> CandidateExamQuestions { get; set; } = new List<CandidateExamQuestion>();
}
