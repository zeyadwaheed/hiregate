namespace HireGate.Service.DTOs;

public class ExamDto
{
    public int Id { get; set; }
    public required string PositionTitle { get; set; }
    public string Mode { get; set; } = "static";
    public int? DurationMinutes { get; set; }
    public int QuestionCount { get; set; }

    public DateTime? WindowStartTime { get; set; }
    public DateTime? WindowEndTime { get; set; }
    public List<QuestionDto> Questions { get; set; } = new List<QuestionDto>();
    public List<ExamTopicRuleDto> TopicRules { get; set; } = new List<ExamTopicRuleDto>();
    }
