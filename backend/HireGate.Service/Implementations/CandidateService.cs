using HireGate.Repository.Interfaces;
using HireGate.Service.Interfaces;
using HireGate.Service.DTOs;
using HireGate.Data.Models;
using System.Security.Principal;
using HireGate.ResultWrapper;
namespace HireGate.Service.Implementations
{
public class CandidateService : ICandidateService
{
    private readonly ICandidateRepository _repo;
    private readonly IEmailService _email;
    private readonly IExamRepository _examRepo;
    private readonly IDateTimeProvider _dateTimeProvider;

    public CandidateService(
        ICandidateRepository repo,
        IEmailService email,
        IExamRepository examRepo,
        IDateTimeProvider dateTimeProvider)
    {
        _repo = repo;
        _email = email;
        _examRepo = examRepo;
        _dateTimeProvider = dateTimeProvider;
    }

//get by id
public async Task<ServiceResult<CandidateResponseDto?>> GetById(int id)
{
    var candidate = await _repo.GetById(id);

    if (candidate == null)
        return ServiceResult<CandidateResponseDto?>.Fail("Candidate not found");

    return ServiceResult<CandidateResponseDto?>.Ok(new CandidateResponseDto
    {
        Id = candidate.Id,
        Email = candidate.Email,
        FirstName = candidate.FirstName,
        LastName = candidate.LastName,
        PhoneNumber = candidate.PhoneNumber,
        Token = candidate.Token,
        StartedAt = candidate.StartedAt,
        SubmittedAt = candidate.SubmittedAt,
        FinalScore = candidate.FinalScore,
        ExamId = candidate.ExamId 
    });
}

// get all
public async Task<ServiceResult<PagedResult<CandidateResponseDto>>> GetAll(int page, int pageSize, string? search, string? status)
{
    var validPage = Math.Max(1, page);
    var validPageSize = Math.Min(Math.Max(1, pageSize), 100);
    var (candidates, totalCount) = await _repo.GetAll(validPage, validPageSize, search, status);

    var data = candidates.Select(c => new CandidateResponseDto
    {
        Id = c.Id,
        Email = c.Email,
        FirstName = c.FirstName,
        LastName = c.LastName,
        PhoneNumber = c.PhoneNumber,
        Token = c.Token,
        StartedAt = c.StartedAt,
        SubmittedAt = c.SubmittedAt,
        FinalScore = c.FinalScore,
        ExamId = c.ExamId
    }).ToList();

    return ServiceResult<PagedResult<CandidateResponseDto>>.Ok(new PagedResult<CandidateResponseDto>
    {
        Items = data,
        TotalCount = totalCount
    });
}

public async Task<ServiceResult<CreateCandidateResponseDto>> CreateCandidate(CreateCandidateDto dto)
{
    /*
    var exists = await _repo.ExistsByEmail(dto.Email);

        if (exists)
    {
        return ServiceResult<CreateCandidateResponseDto>.Fail("Email already exists");
    }
    */

    var candidate = new Candidate
    {
        Email = dto.Email,
        //Token = Guid.NewGuid().ToString(),
        Token = null,
        ExamId = null
    };
    

    await _repo.Add(candidate);

    return ServiceResult<CreateCandidateResponseDto>.Ok(new CreateCandidateResponseDto
    {
        Id = candidate.Id,
        Email = candidate.Email,
        // Message = "Candidate created"
    });
}

public async Task<ServiceResult<bool>> Delete(int id)
{
    var candidate = await _repo.GetById(id);

    if (candidate == null)
        return ServiceResult<bool>.Fail("Candidate not found");

    await _repo.Delete(id);

    return ServiceResult<bool>.Ok(true);
}


public async Task<ServiceResult<bool>> SendExamEmail(SendExamEmailDto dto)
{
    var exam = await _examRepo.GetExamByIdAsync(dto.ExamId);

    if (exam == null)
        return ServiceResult<bool>.Fail("Exam not found");

    var candidate = await _repo.GetById(dto.CandidateId);

    if (candidate == null)
        return ServiceResult<bool>.Fail("Candidate not found");

    // 1. Assign exam
    candidate.StartedAt = null; // reset startedAt when re-assigning exam
    candidate.SubmittedAt = null; // reset submittedAt when re-assigning exam
    candidate.FinalScore = null; // reset finalScore when re-assigning exam
    candidate.ExamId = dto.ExamId;

    // 2. GUARANTEE token exists
    if (string.IsNullOrEmpty(candidate.Token))
    {
        candidate.Token = Guid.NewGuid().ToString();
    }

    // 3. SAVE FIRST (VERY IMPORTANT)
    await _repo.Update(candidate);

    // 4. Build URL AFTER saving
    var examUrl = $"localhost:3000/candidates/complete-profile/{candidate.Token}";

    // 5. Send email
    await _email.SendEmail(
        candidate.Email,
        "Your Exam Link",
        $"Click here:\n{examUrl}"
    );
    
    return ServiceResult<bool>.Ok(true);

}


public async Task<ServiceResult<BulkEmailResultDto>>  SendBulkExamEmail(SendBulkExamEmailDto dto)
{
    var exam = await _examRepo.GetExamByIdAsync(dto.ExamId);

    if (exam == null)
        return ServiceResult<BulkEmailResultDto>.Fail("Exam not found");

    var result = new BulkEmailResultDto
    {
        Total = dto.CandidateIds.Count  
    };
    
    foreach (var id in dto.CandidateIds)
    {
        var candidate = await _repo.GetById(id);

        if (candidate == null)
        {
            result.NotFoundIds.Add(id);
            continue;
        }
        candidate.StartedAt = null; // reset startedAt when re-assigning exam
        candidate.SubmittedAt = null; // reset submittedAt when re-assigning exam
        candidate.FinalScore = null; // reset finalScore when re-assigning exam
        candidate.ExamId = dto.ExamId;
        

        if (string.IsNullOrEmpty(candidate.Token))
        {
            candidate.Token = Guid.NewGuid().ToString();
        }

        await _repo.Update(candidate);

        var examUrl = $"localhost:3000/candidates/complete-profile/{candidate.Token}";

        try
        {
            await _email.SendEmail(
                candidate.Email,
                "Your Exam Link",
                $"Click here:\n{examUrl}"
            );

            result.Results.Add(new BulkEmailItemResultDto
            {
                CandidateId = id,
                Email = candidate.Email,
                Status = "Sent"
            });
        }
        catch (Exception ex)
        {
            result.Results.Add(new BulkEmailItemResultDto
            {
                CandidateId = id,
                Email = candidate.Email,
                Status = "Failed",
                Error = ex.Message
            });
        }
    }
    return ServiceResult<BulkEmailResultDto>.Ok(result);

}



public async Task<ServiceResult<ExamPageDto?>> GetExamPage(string token)
{
    var candidate = await _repo.GetByTokenBasic(token);

    // real error → invalid token
    if (candidate == null)
        return ServiceResult<ExamPageDto?>.Fail("Candidate not found");

    // real error → misconfiguration
    if (candidate.ExamId is null)
        return ServiceResult<ExamPageDto?>.Fail("Exam not assigned");

    var exam = await _examRepo.GetExamByIdAsync(candidate.ExamId.Value);

    // real error → broken data
    if (exam == null)
        return ServiceResult<ExamPageDto?>.Fail("Exam not found");

    var now = _dateTimeProvider.Now;

    // ---------------- WINDOW STATUS ----------------
    string windowStatus;

    if (exam.WindowStartTime == null || exam.WindowEndTime == null)
    {
        windowStatus = "closed";
    }
    else if (now < exam.WindowStartTime)
    {
        windowStatus = "upcoming";
    }
    else if (now > exam.WindowEndTime)
    {
        windowStatus = "closed";
    }
    else
    {
        windowStatus = "open";
    }

    // ---------------- SUBMITTED STATE (IMPORTANT FIX) ----------------
    if (candidate.SubmittedAt != null)
    {
        return ServiceResult<ExamPageDto?>.Ok(new ExamPageDto
        {
            FirstName = candidate.FirstName,
            LastName = candidate.LastName,
            Email = candidate.Email,
            PhoneNumber = candidate.PhoneNumber,

            ExamTitle = exam.PositionTitle,
            DurationMinutes = exam.DurationMinutes,
            QuestionCount = exam.QuestionCount,
            WindowStartTime = exam.WindowStartTime,
            WindowEndTime = exam.WindowEndTime,

            WindowStatus = "submitted"
        });
    }

    // ---------------- NORMAL RESPONSE ----------------
    return ServiceResult<ExamPageDto?>.Ok(new ExamPageDto
    {
        FirstName = candidate.FirstName,
        LastName = candidate.LastName,
        Email = candidate.Email,
        PhoneNumber = candidate.PhoneNumber,

        ExamTitle = exam.PositionTitle,
        DurationMinutes = exam.DurationMinutes,
        QuestionCount = exam.QuestionCount,
        WindowStartTime = exam.WindowStartTime,
        WindowEndTime = exam.WindowEndTime,

        WindowStatus = windowStatus
    });
}
public async Task<ServiceResult<CompleteCandidateProfileResponseDto?>> CompleteProfile(string token, CompleteCandidateProfileDto dto)
{
    var candidate = await _repo.GetByTokenBasic(token);

    Console.WriteLine(candidate == null 
        ? "CANDIDATE NOT FOUND" 
        : $"FOUND CANDIDATE ID = {candidate.Id}, TOKEN = {candidate.Token}");


    if (candidate == null)
        return ServiceResult<CompleteCandidateProfileResponseDto?>.Fail("Candidate not found");

if (candidate.StartedAt != null)
{
    return ServiceResult<CompleteCandidateProfileResponseDto?>.Fail("Profile cannot be edited after exam started");
}
    candidate.FirstName = dto.FirstName;
    candidate.LastName = dto.LastName;
    candidate.PhoneNumber = dto.PhoneNumber;

    await _repo.Update(candidate);

    return ServiceResult<CompleteCandidateProfileResponseDto?>.Ok(new CompleteCandidateProfileResponseDto
    {
        Success = true,
        Message = "Profile completed"
    });
}


public async Task<ServiceResult<StartExamResponseDto>> StartExam(string token)
{
    var candidate = await _repo.GetByTokenWithExamAndQuestions(token);

    if (candidate == null || candidate.Exam == null)
        return ServiceResult<StartExamResponseDto>.Fail("Invalid token");

    if (candidate.SubmittedAt != null)
        return ServiceResult<StartExamResponseDto>.Fail("Exam already submitted");

    var now = _dateTimeProvider.Now;
    var exam = candidate.Exam;

    // Window check (IMPORTANT)
    var windowStatus = GetWindowStatus(now, exam.WindowStartTime, exam.WindowEndTime);

    if (windowStatus != "open")
        return ServiceResult<StartExamResponseDto>.Fail("Exam window is not open");

    // Start exam once
    if (candidate.StartedAt == null)
    {
        candidate.StartedAt = now;
        await _repo.Update(candidate);
    }

    var startTime = candidate.StartedAt.Value;

    if (exam.DurationMinutes == null || exam.DurationMinutes <= 0)
        return ServiceResult<StartExamResponseDto>.Fail("Invalid exam duration");

    var endTime = startTime.AddMinutes(exam.DurationMinutes.Value);

    if (now > endTime)
        return ServiceResult<StartExamResponseDto>.Fail("Your exam time has finished");

    var dto = new StartExamResponseDto
    {
        StartedAt = startTime,
        ExamId = exam.Id,
        PositionTitle = exam.PositionTitle,
        DurationMinutes = exam.DurationMinutes,

        Questions = exam.ExamQuestions.Select(q => new ExamQuestionDto
        {
            Id = q.Question.Id,
            QuestionText = q.Question.QuestionText,
            QuestionImage = q.Question.QuestionImage,

            Choices = q.Question.Choices.Select(c => new ExamChoiceDto
            {
                Id = c.Id,
                Text = c.ChoiceText
            }).ToList()
        }).ToList()
    };

    return ServiceResult<StartExamResponseDto>.Ok(dto);
}


public async Task<ServiceResult<ExamReviewDto?>> GetExamReview(int candidateId)
{
    var candidate = await _repo.GetCandidateWithExam(candidateId);

    if (candidate == null || candidate.Exam == null)
        return ServiceResult<ExamReviewDto?>.Fail("Exam not found");

    var answers = candidate.Answers ?? new List<CandidateAnswer>();

    var questions = candidate.Exam.ExamQuestions.Select(eq =>
    {
        var question = eq.Question;

        var answer = answers.FirstOrDefault(a => a.QuestionId == question.Id);

        var selectedChoiceId = answer?.ChoiceId;

        var correctChoiceId =
            question.Choices.FirstOrDefault(c => c.IsCorrect)?.Id;

        var isCorrect =
            selectedChoiceId != null &&
            correctChoiceId != null &&
            selectedChoiceId == correctChoiceId;

        return new ExamReviewQuestionDto
        {
            QuestionId = question.Id,
            QuestionText = question.QuestionText,
            QuestionImage = question.QuestionImage,
            SelectedChoiceId = selectedChoiceId,

            IsCorrect = isCorrect,

            Choices = question.Choices.Select(c => new ExamReviewChoiceDto
            {
                Id = c.Id,
                Text = c.ChoiceText,
                IsCorrect = c.IsCorrect
            }).ToList()
        };
    }).ToList();

    var finalScore = questions.Count(q => q.IsCorrect);

return ServiceResult<ExamReviewDto?>.Ok(new ExamReviewDto
{
    CandidateId = candidate.Id,
    CandidateName = $"{candidate.FirstName} {candidate.LastName}".Trim(),
    CandidateEmail = candidate.Email, 
ExamTitle = candidate.Exam?.PositionTitle,
    FinalScore = finalScore,
    Questions = questions
});
}




private string GetWindowStatus(DateTime now, DateTime? start, DateTime? end)
{
    if (start == null || end == null)
        return "closed";

    if (now < start)
        return "upcoming";

    if (now > end)
        return "closed";

    return "open";
}
}
}