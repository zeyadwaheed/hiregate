using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using HireGate.Data.Context;
using HireGate.Repository.Interfaces;
using HireGate.Repository.Implementations;
using HireGate.Service.Interfaces;
using HireGate.Service.Implementations;
using HireGate.API.Endpoints;
using FluentValidation;
using FluentValidation.AspNetCore;
using HireGate.Service.Validators;
using HireGate.API.Middlewares;


var builder = WebApplication.CreateBuilder(args);

// --------------------
// DB
// --------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is missing in appsettings.json");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(connectionString));

// --------------------
// Services
// --------------------
builder.Services.AddScoped<IExamService, ExamService>();
builder.Services.AddScoped<ISubmissionService, SubmissionService>();
builder.Services.AddScoped<IExamRepository, ExamRepository>();
builder.Services.AddScoped<ISubmissionRepository, SubmissionRepository>();
builder.Services.AddScoped<ITopicRepository, TopicRepository>();
builder.Services.AddScoped<ITopicService, TopicService>();
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();
builder.Services.AddScoped<IQuestionService, QuestionService>();
builder.Services.AddScoped<IChoiceRepository, ChoiceRepository>();
builder.Services.AddScoped<IChoiceService, ChoiceService>();
builder.Services.AddScoped<IExamQuestionRepository, ExamQuestionRepository>();

builder.Services.AddScoped<IAdminRepository, HrManagerRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICandidateRepository, CandidateRepository>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<ICandidateService, CandidateService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSingleton<IDateTimeProvider, EgyptDateTimeProvider>();

builder.Services.AddValidatorsFromAssemblyContaining<CreateExamDtoValidator>();


// =========================
// VALIDATORS
// =========================
builder.Services.AddValidatorsFromAssemblyContaining<CreateCandidateValidator>();



// =========================
// AUTHENTICATION
// =========================
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"];

        if (string.IsNullOrEmpty(jwtKey))
            throw new Exception("JWT Key is missing in appsettings.json");

        var key = Encoding.UTF8.GetBytes(jwtKey);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CEOOnly", policy => policy.RequireRole("CEO"));
});

// =========================
// CORS
// =========================
builder.Services.AddCors(options =>
{
    // options.AddPolicy("Frontend", policy =>
    // {
    //     var frontendUrl = builder.Configuration["AllowedOrigins:Frontend"]
    //         ?? throw new Exception("AllowedOrigins:Frontend is missing");
    //
    //     policy
    //         .WithOrigins(frontendUrl)
    //         .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
    //         .WithHeaders("Content-Type", "Authorization");
    // });

    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// =========================
// JSON OPTIONS
// =========================
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter());
});





var app = builder.Build();

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();



// --------------------
// Minimal API endpoints
// --------------------
app.MapExamEndpoints();
app.MapSubmissionEndpoints();
app.MapTopicEndpoints(app.Services);
app.MapQuestionEndpoints(app.Services);
app.MapChoiceEndpoints(app.Services);
app.MapCandidateEndpoints();
app.MapAuthEndpoints();
app.MapAdminEndpoints();

app.Run();