using HireGate.Service.Interfaces;
using HireGate.Service.DTOs;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using HireGate.API.Mapping;
using HireGate.ResultWrapper;

namespace HireGate.API.Endpoints;

public static class CandidateEndpoints
{
    public static void MapCandidateEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/candidates");

        // CREATE
        group.MapPost("/", async (
            [FromBody] CreateCandidateDto dto,
            [FromServices] ICandidateService service,
            [FromServices] IValidator<CreateCandidateDto> validator
        ) =>
        {
            var validation = await validator.ValidateAsync(dto);

            if (!validation.IsValid)
                return ApiResponseMapper.ToHttpResult(
                    ServiceResult<object>.Fail(validation.Errors.First().ErrorMessage)
                );

            var result = await service.CreateCandidate(dto);

            return ApiResponseMapper.ToHttpResult(result);
        })
        .RequireAuthorization();


        // COMPLETE PROFILE
        group.MapPut("/complete-profile/{token}", async (
            string token,
            [FromBody] CompleteCandidateProfileDto dto,
            [FromServices] ICandidateService service,
            [FromServices] IValidator<CompleteCandidateProfileDto> validator
        ) =>
        {
            var validation = await validator.ValidateAsync(dto);

            if (!validation.IsValid)
                return ApiResponseMapper.ToHttpResult(
                    ServiceResult<object>.Fail(validation.Errors.First().ErrorMessage)
                );

            var result = await service.CompleteProfile(token, dto);

            return ApiResponseMapper.ToHttpResult(result);
        });


        // GET ALL (paginated)
        group.MapGet("/", async (
            [FromServices] ICandidateService service,
            int page = 1,
            int pageSize = 10,
            string? search = null,
            string? status = null,
            int? examId = null
        ) =>
        {
            var result = await service.GetAll(page, pageSize, search, status, examId);

            return ApiResponseMapper.ToHttpResult(result);
        });


        // GET BY ID
        group.MapGet("/{id:int}", async (
            int id,
            [FromServices] ICandidateService service
        ) =>
        {
            var result = await service.GetById(id);

            return ApiResponseMapper.ToHttpResult(result);
        })
        .RequireAuthorization();


        // DELETE
        group.MapDelete("/{id:int}", async (
            int id,
            [FromServices] ICandidateService service
        ) =>
        {
            var result = await service.Delete(id);

            return ApiResponseMapper.ToHttpResult(result);
        })
        .RequireAuthorization();


        // SEND EMAIL
        group.MapPost("/{id:int}/send-exam-email", async (
            int id,
            [FromBody] SendExamEmailDto dto,
            [FromServices] ICandidateService service,
            [FromServices] IValidator<SendExamEmailDto> validator
        ) =>
        {
            dto.CandidateId = id;

            var validation = await validator.ValidateAsync(dto);

            if (!validation.IsValid)
                return ApiResponseMapper.ToHttpResult(
                    ServiceResult<string>.Fail(validation.Errors.First().ErrorMessage)
                );

            var result = await service.SendExamEmail(dto);

            return ApiResponseMapper.ToHttpResult(result);
        })
        .RequireAuthorization();


        // BULK EMAIL
        group.MapPost("/send-bulk-exam-email", async (
            [FromBody] SendBulkExamEmailDto dto,
            [FromServices] ICandidateService service,
            [FromServices] IValidator<SendBulkExamEmailDto> validator
        ) =>
        {
            var validation = await validator.ValidateAsync(dto);

            if (!validation.IsValid)
                return ApiResponseMapper.ToHttpResult(
                    ServiceResult<string>.Fail(validation.Errors.First().ErrorMessage)
                );

            var result = await service.SendBulkExamEmail(dto);

            return ApiResponseMapper.ToHttpResult(result);
        })
        .RequireAuthorization();


        // START EXAM
        group.MapPost("/start-exam/{token}", async (
            string token,   
            [FromServices] ICandidateService service
        ) =>
        {
            var result = await service.StartExam(token);

            return ApiResponseMapper.ToHttpResult(result);
        });


        // EXAM PAGE
        group.MapGet("/exam-page/{token}", async (
            string token,
            [FromServices] ICandidateService service
        ) =>
        {
            var result = await service.GetExamPage(token);

            return ApiResponseMapper.ToHttpResult(result);
        });


        // EXAM REVIEW
        group.MapGet("/{id:int}/exam-review", async (
            int id,
            [FromServices] ICandidateService service
        ) =>
        {
            var result = await service.GetExamReview(id);

            return ApiResponseMapper.ToHttpResult(result);
        })
        .RequireAuthorization();
    }
}
