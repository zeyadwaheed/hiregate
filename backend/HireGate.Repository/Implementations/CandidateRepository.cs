using HireGate.Data.Context;
using HireGate.Data.Models;
using HireGate.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

public class CandidateRepository : ICandidateRepository
{
    private readonly AppDbContext _context;
    public CandidateRepository(AppDbContext context)
    {
        _context = context;
    }


    public async Task<(List<Candidate> Items, int TotalCount)> GetAll(int page, int pageSize, string? search, string? status)
    {
        var query = _context.Candidates.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c =>
                c.Email.ToLower().Contains(term) ||
                (c.FirstName != null && c.FirstName.ToLower().Contains(term)) ||
                (c.LastName != null && c.LastName.ToLower().Contains(term)) ||
                (c.PhoneNumber != null && c.PhoneNumber.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var s = status.Trim();
            if (string.Equals(s, "Pending", StringComparison.OrdinalIgnoreCase))
                query = query.Where(c => c.SubmittedAt == null && c.StartedAt == null);
            else if (string.Equals(s, "In Progress", StringComparison.OrdinalIgnoreCase))
                query = query.Where(c => c.StartedAt != null && c.SubmittedAt == null);
            else if (string.Equals(s, "Submitted", StringComparison.OrdinalIgnoreCase))
                query = query.Where(c => c.SubmittedAt != null);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }


    public async Task<Candidate?> GetById(int id)
    {
        return await _context.Candidates.FindAsync(id);
    }

    public async Task<Candidate?> GetByIdWithExamReview(int id)
    {
        return await _context.Candidates
            .AsNoTracking()
            .Include(c => c.Exam)
                .ThenInclude(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                        .ThenInclude(q => q.Choices)
            .Include(c => c.Answers)
            .FirstOrDefaultAsync(c => c.Id == id);
    }



    public async Task Add(Candidate candidate)
    {
        await _context.Candidates.AddAsync(candidate);
        await _context.SaveChangesAsync();
    }

    

    public async Task Update(Candidate candidate)
    {
        _context.Candidates.Update(candidate);
        await _context.SaveChangesAsync();
    }


    
    public async Task<bool> Delete(int id)
    {
        var candidate = await _context.Candidates.FindAsync(id);

        if (candidate == null)
            return false;

        _context.Candidates.Remove(candidate);
        await _context.SaveChangesAsync();

        return true;
    }

    // Basic: No includes
    public async Task<Candidate?> GetByTokenBasic(string token)
    {
        return await _context.Candidates.FirstOrDefaultAsync(c => c.Token == token);
    }

    // With Exam only
    public async Task<Candidate?> GetByTokenWithExam(string token)
    {
        return await _context.Candidates
            .Include(c => c.Exam)
            .FirstOrDefaultAsync(c => c.Token == token);
    }

    // With Exam, ExamQuestions, Question, Choices, Answers
    public async Task<Candidate?> GetByTokenWithExamAndQuestions(string token)
    {
        return await _context.Candidates
            .Include(c => c.Exam)
                .ThenInclude(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                        .ThenInclude(q => q.Choices)
            .FirstOrDefaultAsync(c => c.Token == token);
    }

    public async Task<Candidate?> GetByTokenWithExamAndTopicRules(string token)
    {
        return await _context.Candidates
            .Include(c => c.Exam)
                .ThenInclude(e => e.TopicRules)
            .FirstOrDefaultAsync(c => c.Token == token);
    }

    public async Task<List<Question>> GetCandidateExamQuestions(int candidateId)
    {
        var questions = await _context.CandidateExamQuestions
            .Where(candidateQuestion => candidateQuestion.CandidateId == candidateId)
            .OrderBy(candidateQuestion => candidateQuestion.Id)
            .Include(candidateQuestion => candidateQuestion.Question)
                .ThenInclude(question => question.Choices)
            .Select(candidateQuestion => candidateQuestion.Question)
            .ToListAsync();

        return questions
            .DistinctBy(question => question.Id)
            .ToList();
    }

    public async Task<List<Question>> GetExamQuestions(int examId)
    {
        return await _context.ExamQuestions
            .Where(examQuestion => examQuestion.ExamId == examId)
            .Include(examQuestion => examQuestion.Question)
                .ThenInclude(question => question.Choices)
            .Select(examQuestion => examQuestion.Question)
            .Where(question => question.DeletedAt == null)
            .ToListAsync();
    }

    public async Task<List<Question>> GetQuestionsByTopic(int topicId)
    {
        return await _context.Questions
            .Where(question => question.TopicId == topicId && question.DeletedAt == null)
            .Include(question => question.Choices)
            .ToListAsync();
    }

    public async Task AddCandidateExamQuestions(int candidateId, IEnumerable<int> questionIds)
    {
        var existingQuestionIds = await _context.CandidateExamQuestions
            .Where(candidateQuestion => candidateQuestion.CandidateId == candidateId)
            .Select(candidateQuestion => candidateQuestion.QuestionId)
            .ToHashSetAsync();

        var candidateQuestions = questionIds
            .Distinct()
            .Where(questionId => !existingQuestionIds.Contains(questionId))
            .Select(questionId => new CandidateExamQuestion
        {
            CandidateId = candidateId,
            QuestionId = questionId
        })
            .ToList();

        if (candidateQuestions.Count == 0)
            return;

        await _context.CandidateExamQuestions.AddRangeAsync(candidateQuestions);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsDuplicateCandidateQuestionException(ex))
        {
            foreach (var entry in _context.ChangeTracker.Entries<CandidateExamQuestion>()
                .Where(entry => entry.State == EntityState.Added))
            {
                entry.State = EntityState.Detached;
            }
        }
    }

    private static bool IsDuplicateCandidateQuestionException(DbUpdateException ex)
    {
        var message = ex.InnerException?.Message ?? ex.Message;

        return message.Contains("UX_candidate_exam_questions_candidate_question", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase);
    }



    public async Task AssignExam(int candidateId, int examId)
    {
        await _context.Candidates
            .Where(c => c.Id == candidateId)
            .ExecuteUpdateAsync(setters =>
                setters.SetProperty(c => c.ExamId, examId));
    }



public async Task<Candidate?> GetCandidateWithExam(int id)
{
    return await _context.Candidates
        .Include(c => c.Exam)
        .Include(c => c.Answers)
        .FirstOrDefaultAsync(c => c.Id == id);
}
}
