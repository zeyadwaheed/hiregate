using HireGate.Service.Interfaces;
using HireGate.Service.DTOs;
using FluentValidation;
using HireGate.Service.Exceptions;
namespace HireGate.API.Endpoints;


    public static class ExamEndpoints
    {
        public static void MapExamEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/api/exam");
             //  .RequireAuthorization();
            //var group = app.MapGroup("/api/exam").RequireAuthorization();

            // ────────────────────────────────────────────────────────
            // GET all exams
            // ────────────────────────────────────────────────────────

            group.MapGet("/", async (
                IExamService examService, 
                int page = 1,
                int pageSize = 6,
                string? search = null) =>
                {
                var validPage = Math.Max(1, page);
                var validPageSize = Math.Min(Math.Max(1, pageSize), 100);
                var (exams, totalCount) = await examService.GetAllExamsAsync(validPage, validPageSize, search);
                var totalPages = validPageSize == 0 ? 0 : (int)Math.Ceiling((double)totalCount / validPageSize);

                var result = new
                {
                    data = exams,
                    page = validPage,
                    pageSize = validPageSize,
                    totalCount,
                    totalPages
                };

                return Results.Ok(result);
                });

            // ────────────────────────────────────────────────────────
            // GET Exam by id
            // ────────────────────────────────────────────────────────

            group.MapGet("/{id:int}", async (int id, IExamService examService) =>
                {
                var exam = await examService.GetExamByIdAsync(id);

                return exam is null
                    ? Results.NotFound()
                    : Results.Ok(exam);
                });

            // ────────────────────────────────────────────────────────
            // Create Exam
            // ────────────────────────────────────────────────────────

            group.MapPost("/", async (
                CreateExamDto examDto,
                IExamService examService,
                IValidator<CreateExamDto> validator) =>
                {
                    // result is an object, we have to check on its isValid property
                    var result = await validator.ValidateAsync(examDto);

                    if(!result.IsValid)
                     {
                        return Results.BadRequest(result.Errors.Select(e => new
                    {
                            field = e.PropertyName,
                            error = e.ErrorMessage
                    }));
                    }
                    try
                    {
                        var createdExam = await examService.CreateExamAsync(examDto);
                        return Results.Created($"/api/exam/{createdExam.Id}", createdExam);
                    }
                    catch (InvalidQuestionIdsException)
                    {
                        return Results.BadRequest(new
                        {
                            field = "QuestionIds",
                            error = "One or more question IDs are invalid.",
                        });
                    }
                    catch (InvalidTopicIdsException)
                    {
                        return Results.BadRequest(new
                        {
                            field = "TopicRules",
                            error = "One or more topic IDs are invalid.",
                        });
                    }
                    catch (ArgumentException ex)
                    {
                        return Results.BadRequest(new
                        {
                            field = "Mode",
                            error = ex.Message,
                        });
                    }
                    
                });

            // ────────────────────────────────────────────────────────
            // Update Exam
            // ────────────────────────────────────────────────────────

            group.MapPatch("/{id:int}", async (
            int id,
            UpdateExamDto examDto,
            IExamService examService,
            IValidator<UpdateExamDto> validator) =>
            {
                var result = await validator.ValidateAsync(examDto);

                if(!result.IsValid)
                {
                return Results.BadRequest(result.Errors.Select(e => new
                {
                    field = e.PropertyName,
                    error = e.ErrorMessage
                }));
                }

                try{
                var updatedExam = await examService.UpdateExamAsync(id, examDto);
                return updatedExam is null
                    ? Results.NotFound()
                    : Results.Ok(updatedExam);
                    
                }catch(InvalidQuestionIdsException)
                {
                    return Results.BadRequest(new
                    {
                        field = "QuestionIds",
                        error = "One or more question IDs are invalid.",
                    });
                }
                catch(InvalidTopicIdsException)
                {
                    return Results.BadRequest(new
                    {
                        field = "TopicRules",
                        error = "One or more topic IDs are invalid.",
                    });
                }
                catch(ArgumentException ex)
                {
                    return Results.BadRequest(new
                    {
                        field = "Mode",
                        error = ex.Message,
                    });
                }
                
            });

            // ────────────────────────────────────────────────────────
            // Delete Exam
            // ────────────────────────────────────────────────────────

            group.MapDelete("/{id:int}", async (int id, IExamService examService) =>
                {
                var success = await examService.DeleteExamAsync(id);

                return success
                    ? Results.NoContent()
                    : Results.NotFound();
                });
            
            // Question management within exams API Endpoints
            
            // ────────────────────────────────────────────────────────
            // GET  /api/exam/{id}/questions
            // Returns all questions that belong to an exam
            // ────────────────────────────────────────────────────────

            group.MapGet("/{id:int}/questions", 
            async (int id, IExamService examService) => 
            { 
                var exam = await examService.GetExamByIdAsync(id);
                 if (exam is null) 
                 return Results.NotFound();
                 return Results.Ok(exam.Questions); 
            });
            
            // ────────────────────────────────────────────────────────
            // POST  /api/exam/{id}/questions/{questionId}
            // Adds an existing question to an exam
            // ────────────────────────────────────────────────────────

            group.MapPost("/{id:int}/questions/{questionId:int}", async (
                int id,
                int questionId,
                IExamService examService) =>
            {
                var exam = await examService.GetExamByIdAsync(id);

                if (exam is null)
                    return Results.NotFound($"Exam with ID {id} not found.");

                var success = await examService.AddQuestionToExamAsync(id, questionId);

                return success
                    ? Results.Ok($"Question {questionId} added to Exam {id}.")
                    : Results.BadRequest($"Failed to add Question {questionId}.");
            });

            // ────────────────────────────────────────────────────────
            // DELETE  /api/exam/{id}/questions/{questionId}
            // Removes a question from an exam (does NOT delete the question itself)
            // ────────────────────────────────────────────────────────

            group.MapDelete("/{id:int}/questions/{questionId:int}", async (
                int id,
                int questionId,
                IExamService examService) =>
            {
                var exam = await examService.GetExamByIdAsync(id);

                if (exam is null)
                    return Results.NotFound($"Exam with ID {id} not found.");

                var success = await examService.RemoveQuestionFromExamAsync(id, questionId);

                return success
                    ? Results.Ok($"Question {questionId} removed from Exam {id}.")
                    : Results.BadRequest($"Failed to remove Question {questionId}.");
            });

            
            }
    }
