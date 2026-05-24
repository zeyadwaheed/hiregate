using System.ComponentModel.DataAnnotations;
namespace HireGate.Data.Models;

public class Candidate
{
    [Key]
    public int Id { get; set; }

    [MaxLength(30)]
    public string? FirstName { get; set; } 
    [MaxLength(30)]
    public string? LastName { get; set; }
    [EmailAddress]

    public string Email { get; set; } = null!;
    [MaxLength(15)]
    public string? PhoneNumber { get; set; }
    public int? ExamId { get; set; } 
    public string? Token { get; set; }

    public DateTime? StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public int? FinalScore { get; set; }

    public Exam? Exam { get; set; }

    public ICollection<CandidateAnswer> Answers { get; set; } = new List<CandidateAnswer>();
    public ICollection<CandidateExamQuestion> CandidateExamQuestions { get; set; } = new List<CandidateExamQuestion>();

    // Navigation property
    }
