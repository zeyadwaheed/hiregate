using System.ComponentModel.DataAnnotations;
namespace HireGate.Data.Models;
public class Topic
{
    [Key]
    public int Id { get; set; }
    
    [MaxLength(30)]
    public string TopicName { get; set; } = null!;

    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<ExamTopicRule> ExamTopicRules { get; set; } = new List<ExamTopicRule>();

}   
