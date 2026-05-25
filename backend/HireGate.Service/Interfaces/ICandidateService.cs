using HireGate.Service.DTOs;
using HireGate.ResultWrapper;
using HireGate.ResultWrapper; 

namespace HireGate.Service.Interfaces

{

public interface ICandidateService
{
    Task<ServiceResult<PagedResult<CandidateResponseDto>>> GetAll(int page, int pageSize, string? search, string? status, int? examId);
    Task<ServiceResult<CandidateResponseDto?>> GetById(int id);

    Task<ServiceResult<CreateCandidateResponseDto>> CreateCandidate(CreateCandidateDto dto);

    Task<ServiceResult<bool>> Delete(int id);

    Task<ServiceResult<bool>> SendExamEmail(SendExamEmailDto dto);
    Task<ServiceResult<BulkEmailResultDto>> SendBulkExamEmail(SendBulkExamEmailDto dto);
    Task<ServiceResult<CompleteCandidateProfileResponseDto?>> CompleteProfile(string token, CompleteCandidateProfileDto dto);

    Task<ServiceResult<ExamPageDto?>> GetExamPage(string token);

    Task<ServiceResult<StartExamResponseDto>> StartExam(string token);
    Task<ServiceResult<ExamReviewDto?>> GetExamReview(int candidateId);    
    }
}
