using HireGate.Data.Models;

namespace HireGate.Repository.Interfaces
{
    public interface IExamRepository
    {
        Task<(IEnumerable<Exam> Exams, int TotalCount)> GetAllExamsAsync(int pageNumber, int pageSize, string? search = null);
        Task<Exam?> GetExamByIdAsync(int id);
        Task<Exam?> GetExamByIdForUpdateAsync(int id);
        Task<List<int>> GetNonExistentTopicIdsAsync(IEnumerable<int> topicIds);
        Task ReplaceExamQuestionsAsync(int examId, IEnumerable<int> questionIds);
        Task ReplaceExamTopicRulesAsync(int examId, IEnumerable<ExamTopicRule> topicRules);
        Task SetQuestionCountAsync(int examId, int questionCount);
        Task<bool> DeleteExamByIdAsync(int id);
        void CreateExam(Exam exam);
        void UpdateExam(Exam exam);
        void DeleteExam(Exam exam);
        Task SaveAsync();
    }
}
