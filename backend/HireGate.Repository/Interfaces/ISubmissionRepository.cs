using HireGate.Data.Models;

namespace HireGate.Repository.Interfaces
{
    public interface ISubmissionRepository
    {
        Task<Candidate?> GetCandidateByTokenAsync(string token);
        Task<Dictionary<int, Choice>> GetChoicesByIdsAsync(IEnumerable<int> choiceIds);
        Task<IEnumerable<Question>> GetQuestionsAsync(int examId);
        Task<HashSet<int>> GetCandidateQuestionIdsAsync(int candidateId);
        Task<Exam?> GetExamByIdAsync(int examId);
        void AddCandidateAnswers(IEnumerable<CandidateAnswer> answers);
        void UpdateCandidate(Candidate candidate);
        Task SaveAsync();
    }
}
