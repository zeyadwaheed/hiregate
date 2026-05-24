using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using HireGate.Data.Models;

namespace HireGate.Data.Configurations;

public class CandidateConfiguration : IEntityTypeConfiguration<Candidate>
{
    public void Configure(EntityTypeBuilder<Candidate> builder)
    {
        builder.ToTable("candidates");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("candidate_id");

        builder.Property(c => c.FirstName).HasColumnName("first_name").HasMaxLength(30);
        builder.Property(c => c.LastName).HasColumnName("last_name").HasMaxLength(30);
        builder.Property(c => c.Email).HasColumnName("email").IsRequired();
        builder.Property(c => c.PhoneNumber).HasColumnName("phone_number").HasMaxLength(15);

        builder.Property(c => c.ExamId).HasColumnName("exam_id");
        builder.Property(c => c.Token).HasColumnName("token");

        builder.Property(c => c.StartedAt).HasColumnName("started_at");
        builder.Property(c => c.SubmittedAt).HasColumnName("submitted_at");
        builder.Property(c => c.FinalScore).HasColumnName("final_score");

        builder.HasOne(q => q.Exam)          
            .WithMany(t => t.Candidates)      
            .HasForeignKey(q => q.ExamId)    
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(c => c.Email).HasDatabaseName("UX_Candidates_Email");
        builder.HasIndex(c => c.Token).IsUnique().HasDatabaseName("UX_Candidates_Token");
    }
}
