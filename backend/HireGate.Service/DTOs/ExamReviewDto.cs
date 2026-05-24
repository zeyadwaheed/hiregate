namespace HireGate.Service.DTOs;

public class ExamReviewDto
{
    public int CandidateId { get; set; }

    public string CandidateName { get; set; } = string.Empty;

    public string? CandidateEmail { get; set; }   // ✅ ADD
    public string? ExamTitle { get; set; }        // ✅ ADD

    public int? FinalScore { get; set; }

    public List<ExamReviewQuestionDto> Questions { get; set; } = [];
}