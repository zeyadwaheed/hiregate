namespace HireGate.Service.DTOs;

public class ExamTopicRuleDto
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
}
