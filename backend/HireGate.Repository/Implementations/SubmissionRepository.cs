using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HireGate.Data.Context;
using HireGate.Data.Models;
using HireGate.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HireGate.Repository.Implementations
{
    public class SubmissionRepository : ISubmissionRepository
    {
        private readonly AppDbContext _context;

        public SubmissionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Candidate?> GetCandidateByTokenAsync(string token)
            => await _context.Candidates.Include(c => c.Exam).FirstOrDefaultAsync(c => c.Token == token);

        public async Task<Dictionary<int, Choice>> GetChoicesByIdsAsync(IEnumerable<int> choiceIds)
            => await _context.Choices.Where(c => choiceIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id);

        public async Task<IEnumerable<Question>> GetQuestionsAsync(int examId)
        {
            return await _context.ExamQuestions
                .Where(eq => eq.ExamId == examId)
                .Include(eq => eq.Question)
                    .ThenInclude(q => q.Choices)
                .Include(eq => eq.Question)
                    .ThenInclude(q => q.Topic)
                .Select(eq => eq.Question)
                .ToListAsync();
        }

        public async Task<HashSet<int>> GetCandidateQuestionIdsAsync(int candidateId)
        {
            return await _context.CandidateExamQuestions
                .Where(candidateQuestion => candidateQuestion.CandidateId == candidateId)
                .Select(candidateQuestion => candidateQuestion.QuestionId)
                .ToHashSetAsync();
        }

        public async Task<Exam?> GetExamByIdAsync(int examId)
        {
            return await _context.Exams
                .AsNoTracking()
                .Include(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Choices)
                .Include(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Topic)
                .AsSplitQuery()
                .FirstOrDefaultAsync(e => e.Id == examId);
        }

        public void AddCandidateAnswers(IEnumerable<CandidateAnswer> answers)
        {
            _context.CandidateAnswers.AddRange(answers);
        }

        public void UpdateCandidate(Candidate candidate)
        {
            _context.Candidates.Update(candidate);
        }

        public async Task SaveAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
