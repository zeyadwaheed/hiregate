using System.Text.Json.Serialization;

namespace HireGate.Service.DTOs;
public class CreateExamDto
{
    public string PositionTitle { get; set; } = null!;
    public string Mode { get; set; } = "static";
    public int? DurationMinutes { get; set; }
    public DateTime? WindowStartTime { get; set; }
    public DateTime? WindowEndTime { get; set; }
    [JsonPropertyName("questionIds")]
    public List<int> QuestionIds { get; set; } = [];
    public List<ExamTopicRuleDto> TopicRules { get; set; } = [];
}
