using HireGate.Service.Interfaces;
using HireGate.Service.DTOs;
using FluentValidation;
using System;
using System.Linq;
using System.Collections.Generic;
namespace HireGate.API.Endpoints
{
    public static class QuestionEndpoints
    {
        public static void MapQuestionEndpoints(this WebApplication app, IServiceProvider serviceProvider)
        {
            var adminGroup = app.MapGroup("/api/admin/questions")
                .RequireAuthorization();

            adminGroup.MapGet("/", GetAllQuestions)
                .WithName("GetAllQuestions");

            adminGroup.MapGet("/{id}", GetQuestionById)
                .WithName("GetQuestionById");

            adminGroup.MapPost("/", CreateQuestion)
                .WithName("CreateQuestion");

            adminGroup.MapPut("/{id}", UpdateQuestion)
                .WithName("UpdateQuestion");

            adminGroup.MapPatch("/{id}", PatchQuestion)
                .WithName("PatchQuestion");

            adminGroup.MapDelete("/{id}", DeleteQuestion)
                .WithName("DeleteQuestion");

            adminGroup.MapPatch("/{id}/restore", RestoreQuestion)
                .WithName("RestoreQuestion");

            adminGroup.MapPost("/upload-image", UploadQuestionImage)
                .WithName("UploadQuestionImage")
                .DisableAntiforgery();
        }

        private static async Task<IResult> GetAllQuestions(
            IQuestionService questionService,
            int page = 1,
            int pageSize = 10,
            int? topicId = null,
            string? search = null,
            string deletedFilter = "active")
        {
            try
            {
                var validPage = Math.Max(1, page);
                var validPageSize = Math.Min(Math.Max(1, pageSize), 100);
                bool? isDeleted = deletedFilter.ToLowerInvariant() switch
                {
                    "active" => false,
                    "deleted" => true,
                    "all" => (bool?)null,
                    _ => throw new ArgumentException("deletedFilter must be one of: active, deleted, all")
                };

                var (questions, totalCount) = await questionService.GetAllQuestionsAsync(validPage, validPageSize, topicId, search, isDeleted);

                var totalPages = validPageSize == 0 ? 0 : (int)Math.Ceiling((double)totalCount / validPageSize);

                var result = new
                {
                    data = questions,
                    page = validPage,
                    pageSize = validPageSize,
                    totalCount,
                    totalPages
                };

                return Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }

        private static async Task<IResult> GetQuestionById(int id, IQuestionService questionService)
        {
            try
            {
                var question = await questionService.GetQuestionByIdAsync(id);
                if (question == null)
                    return Results.NotFound(new { message = $"Question with ID {id} not found" });

                return Results.Ok(question);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }

        private static async Task<IResult> CreateQuestion(CreateQuestionDto question, IQuestionService questionService)
        {
            try
            {
                var createdQuestion = await questionService.CreateQuestionAsync(question);
                return Results.CreatedAtRoute("GetQuestionById", new { id = createdQuestion.Id }, createdQuestion);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }

        private static async Task<IResult> UpdateQuestion(int id, UpdateQuestionDto question, IQuestionService questionService)
        {
            try
            {
                var updatedQuestion = await questionService.UpdateQuestionAsync(id, question);
                return Results.Ok(updatedQuestion);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }

        private static async Task<IResult> PatchQuestion(int id, PatchQuestionDto question, IQuestionService questionService)
        {
            try
            {
                var patchedQuestion = await questionService.PatchQuestionAsync(id, question);
                return Results.Ok(patchedQuestion);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }

        private static async Task<IResult> DeleteQuestion(int id, IQuestionService questionService)
        {
            try
            {
                var success = await questionService.DeleteQuestionAsync(id);
                if (!success)
                    return Results.NotFound(new { message = $"Question with ID {id} not found" });

                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }

        private static async Task<IResult> RestoreQuestion(int id, IQuestionService questionService)
        {
            try
            {
                var success = await questionService.RestoreQuestionAsync(id);
                if (!success)
                    return Results.NotFound(new { message = $"Question with ID {id} not found" });

                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }

        private static async Task<IResult> UploadQuestionImage(IFormFile file, IWebHostEnvironment env)
        {
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { message = "No file was provided." });

            if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { message = "Only image files are allowed." });

            var uploadsFolder = Path.Combine(env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "images", "questions");
            Directory.CreateDirectory(uploadsFolder);

            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return Results.Ok(new { imageUrl = $"/images/questions/{fileName}" });
        }

    }
}