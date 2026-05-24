using System.ComponentModel.DataAnnotations;

namespace HireGate.Data.Models;

public class ExamTopicRule
{
    [Key]
    public int Id { get; set; }

    public int ExamId { get; set; }
    public int TopicId { get; set; }
    public int QuestionCount { get; set; }

    public Exam Exam { get; set; } = null!;
    public Topic Topic { get; set; } = null!;
}
