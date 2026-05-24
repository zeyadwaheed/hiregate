using System.Security.Cryptography.X509Certificates;

namespace HireGate.Service.DTOs;

public class ExamPageDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }

    public string? ExamTitle { get; set; }
    public int? DurationMinutes { get; set; }
    public int? QuestionCount { get; set; }

    public DateTime? WindowStartTime { get; set; }
    public DateTime? WindowEndTime { get; set; }

    // NEW FIELD
    public string WindowStatus { get; set; } = string.Empty;
}