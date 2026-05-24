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
            .ThenInclude(e => e.ExamQuestions)
                .ThenInclude(eq => eq.Question)
                    .ThenInclude(q => q.Choices)
        .Include(c => c.Answers)
        .FirstOrDefaultAsync(c => c.Id == id);
}
}