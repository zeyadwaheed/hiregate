using HireGate.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HireGate.Data.Configurations;

public class CandidateExamQuestionConfiguration : IEntityTypeConfiguration<CandidateExamQuestion>
{
    public void Configure(EntityTypeBuilder<CandidateExamQuestion> builder)
    {
        builder.ToTable("candidate_exam_questions");

        builder.HasKey(candidateQuestion => candidateQuestion.Id);
        builder.Property(candidateQuestion => candidateQuestion.Id).HasColumnName("id");
        builder.Property(candidateQuestion => candidateQuestion.CandidateId).HasColumnName("candidate_id");
        builder.Property(candidateQuestion => candidateQuestion.QuestionId).HasColumnName("question_id");

        builder.HasIndex(candidateQuestion => candidateQuestion.CandidateId);
        builder.HasIndex(candidateQuestion => candidateQuestion.QuestionId);

        builder.HasOne(candidateQuestion => candidateQuestion.Candidate)
            .WithMany(candidate => candidate.CandidateExamQuestions)
            .HasForeignKey(candidateQuestion => candidateQuestion.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(candidateQuestion => candidateQuestion.Question)
            .WithMany(question => question.CandidateExamQuestions)
            .HasForeignKey(candidateQuestion => candidateQuestion.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
