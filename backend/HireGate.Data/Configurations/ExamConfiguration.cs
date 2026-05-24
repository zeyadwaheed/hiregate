using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using HireGate.Data.Models;

namespace HireGate.Data.Configurations;

public class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.ToTable("exams", table => table.HasCheckConstraint(
            "CK_exams_mode",
            "mode IN ('static', 'dynamic', 'hybrid')"));

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("exam_id");

        builder.Property(e => e.PositionTitle)
            .HasColumnName("position_title")
            .HasMaxLength(100);

        builder.Property(e => e.DurationMinutes)
            .HasColumnName("duration_minutes");

        builder.Property(e => e.Mode)
            .HasColumnName("mode")
            .HasColumnType("varchar(20)")
            .HasConversion(
                mode => mode.ToString().ToLower(),
                value => Enum.Parse<ExamMode>(value, true))
            .HasDefaultValue(ExamMode.Static)
            .IsRequired();

        builder.Property(e => e.QuestionCount)
            .HasColumnName("question_count")
            .HasDefaultValue(0);

        builder.Property(e => e.WindowStartTime).HasColumnName("window_start_time");
        builder.Property(e => e.WindowEndTime).HasColumnName("window_end_time");

        builder.HasIndex(e => e.PositionTitle).HasDatabaseName("IX_Exams_PositionTitle");
    }
}
