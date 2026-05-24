namespace HireGate.Service.DTOs;
public class UpdateExamDto
{
    public string? PositionTitle { get; set; }
    public string? Mode { get; set; }
    public int? DurationMinutes { get; set; }
    public DateTime? WindowStartTime { get; set; }
    public DateTime? WindowEndTime { get; set; }

    public List<int>? QuestionIds { get; set; }
    public List<int>? AddedQuestionIds { get; set; }
    public List<int>? RemovedQuestionIds { get; set; }
    public List<ExamTopicRuleDto>? TopicRules { get; set; }
}
