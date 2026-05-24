using HireGate.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HireGate.Data.Configurations;

public class ExamTopicRuleConfiguration : IEntityTypeConfiguration<ExamTopicRule>
{
    public void Configure(EntityTypeBuilder<ExamTopicRule> builder)
    {
        builder.ToTable("exam_topic_rules");

        builder.HasKey(rule => rule.Id);
        builder.Property(rule => rule.Id).HasColumnName("id");
        builder.Property(rule => rule.ExamId).HasColumnName("exam_id");
        builder.Property(rule => rule.TopicId).HasColumnName("topic_id");
        builder.Property(rule => rule.QuestionCount).HasColumnName("question_count").IsRequired();

        builder.HasIndex(rule => rule.ExamId);
        builder.HasIndex(rule => rule.TopicId);

        builder.HasOne(rule => rule.Exam)
            .WithMany(exam => exam.TopicRules)
            .HasForeignKey(rule => rule.ExamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rule => rule.Topic)
            .WithMany(topic => topic.ExamTopicRules)
            .HasForeignKey(rule => rule.TopicId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
