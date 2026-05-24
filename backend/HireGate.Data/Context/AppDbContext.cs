using Microsoft.EntityFrameworkCore;
using HireGate.Data.Models;
using HireGate.Data.Configurations;

namespace HireGate.Data.Context
{
    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {

        public DbSet<Admin> Admins => Set<Admin>();
        public DbSet<Topic> Topics => Set<Topic>();
        public DbSet<Candidate> Candidates => Set<Candidate>();
        public DbSet<Question> Questions => Set<Question>();
        public DbSet<Choice> Choices => Set<Choice>();
        public DbSet<Exam> Exams => Set<Exam>();
        public DbSet<CandidateAnswer> CandidateAnswers => Set<CandidateAnswer>();
        public DbSet<ExamTopicRule> ExamTopicRules => Set<ExamTopicRule>();
        public DbSet<CandidateExamQuestion> CandidateExamQuestions => Set<CandidateExamQuestion>();

        public DbSet<ExamQuestion> ExamQuestions => Set<ExamQuestion>();

       
       protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            modelBuilder.Entity<ExamQuestion>()
                .HasKey(eq => new { eq.ExamId, eq.QuestionId });

            modelBuilder.Entity<Admin>() // Store the enum as text instead of numbers
                .Property(a => a.Role)
                .HasConversion<string>(); // Enum Role change
        
        }
    }
}
