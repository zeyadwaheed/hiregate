using System.ComponentModel.DataAnnotations;

namespace HireGate.Data.Models;

public class CandidateExamQuestion
{
    [Key]
    public int Id { get; set; }

    public int CandidateId { get; set; }
    public int QuestionId { get; set; }

    public Candidate Candidate { get; set; } = null!;
    public Question Question { get; set; } = null!;
}
