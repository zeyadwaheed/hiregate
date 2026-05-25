using HireGate.Data.Context;
using HireGate.Data.Models;
// using HireGate.Service.DTOs;

namespace HireGate.Repository.Interfaces
{

public interface ICandidateRepository
{
    Task<(List<Candidate> Items, int TotalCount)> GetAll(int page, int pageSize, string? search, string? status, int? examId);
    //Task<bool> ExistsByEmail(string email);
    Task<Candidate?> GetById(int id);
    Task<Candidate?> GetByIdWithExamReview(int id);
    Task Add(Candidate candidate);
    Task Update(Candidate candidate);
    Task<bool> Delete(int id);
    // Basic: No includes
    Task<Candidate?> GetByTokenBasic(string token);
    // With Exam only
    Task<Candidate?> GetByTokenWithExam(string token);
    // With Exam, ExamQuestions, Question, Choices, Answers
    Task<Candidate?> GetByTokenWithExamAndQuestions(string token);
    Task<Candidate?> GetByTokenWithExamAndTopicRules(string token);
    Task<List<Question>> GetCandidateExamQuestions(int candidateId);
    Task<List<Question>> GetExamQuestions(int examId);
    Task<List<Question>> GetQuestionsByTopic(int topicId);
    Task AddCandidateExamQuestions(int candidateId, IEnumerable<int> questionIds);
    Task ClearCandidateExamState(int candidateId);
    Task AssignExam(int candidateId, int examId);
    Task<Candidate?> GetCandidateWithExam(int candidateId);
}
}
