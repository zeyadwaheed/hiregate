using HireGate.Repository.Interfaces;
using HireGate.Service.Interfaces;
using HireGate.Service.DTOs;
using HireGate.Data.Models;
using HireGate.ResultWrapper; 
using Microsoft.Extensions.Configuration;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BCrypt.Net;
  
namespace HireGate.Service.Implementations
{
public class AdminService : IAdminService
{
    private readonly IAdminRepository _repo;
    private readonly IConfiguration _config;
    private readonly IEmailService _email;
        private readonly IDateTimeProvider _dateTimeProvider;

public AdminService(IAdminRepository repo, IConfiguration config, IEmailService email, IDateTimeProvider dateTimeProvider)
{
    _repo = repo;
    _config = config;
    _email = email;
    _dateTimeProvider = dateTimeProvider;
}

    // GET ALL
    public async Task<ServiceResult<PagedResult<AdminResponseDto>>> GetAll(int page, int pageSize, string? search)
    {
        var validPage = Math.Max(1, page);
        var validPageSize = Math.Min(Math.Max(1, pageSize), 100);
        var (admins, totalCount) = await _repo.GetAll(validPage, validPageSize, search);

        var data = admins.Select(a => new AdminResponseDto
        {
            Id = a.Id,
            FirstName = a.FirstName,
            LastName = a.LastName,
            Email = a.Email,
            Role = a.Role.ToString(),
        }).ToList();

        return ServiceResult<PagedResult<AdminResponseDto>>.Ok(new PagedResult<AdminResponseDto>
        {
            Items = data,
            TotalCount = totalCount
        });
    }

    // GET BY ID
    public async Task<ServiceResult<AdminResponseDto?>> GetById(int id)
    {
        var admin = await _repo.GetById(id);

        if (admin == null)
            return ServiceResult<AdminResponseDto?>.Fail("Admin not found");

        return ServiceResult<AdminResponseDto?>.Ok(new AdminResponseDto
        {
            Id = admin.Id,
            Email = admin.Email,
            Role = admin.Role.ToString()
        });
    }

    // CREATE ADMIN
    public async Task<ServiceResult<CreateAdminResponseDto>> CreateAdmin(CreateAdminRequestDto dto)
    {
            var existing = await _repo.GetByEmail(dto.Email);

        if (existing != null)
    {
        return ServiceResult<CreateAdminResponseDto>.Fail("Email already exists");
    }

        var admin = new Admin
        {
            Email = dto.Email,
            Role = (UserRole)dto.Role,
            FirstName = null,
            LastName = null,
            PasswordHash = null
        };

        await _repo.Add(admin);
        var completeRegisterUrl = "localhost:3000/complete-register";
        await _email.SendEmail(
            admin.Email,
            "Welcome to HireGate",
            $"Your admin account has been created, please set your password \nClick here:\n{completeRegisterUrl}"
        );
        return ServiceResult<CreateAdminResponseDto>.Ok(new CreateAdminResponseDto
        {
            Id = admin.Id,
            Email = admin.Email,
            Role = admin.Role.ToString(),
            Message = "Admin created successfully"
        });
    }

    // DELETE ADMIN
    public async Task<ServiceResult<bool>> Delete(int id)
    {
        var admin = await _repo.GetById(id);

        if (admin == null)
        {
            return ServiceResult<bool>.Fail("Admin not found");
        }
        
    // prevent deleting last CEO
    if (admin.Role == UserRole.CEO)
    {
        var ceoCount = await _repo.CountByRole(UserRole.CEO);

        if (ceoCount <= 1)
            return ServiceResult<bool>.Fail("Cannot delete last CEO");
    }
    
        await _repo.Delete(admin);

        return ServiceResult<bool>.Ok(true);
    }

// UPDATE ROLE
public async Task<ServiceResult<UpdateAdminRoleResponseDto>> UpdateRole(int id, UpdateAdminRoleDto dto)
{
    var admin = await _repo.GetById(id);

    if (admin == null)
    {
        return ServiceResult<UpdateAdminRoleResponseDto>.Fail("Admin not found");
    };

    // safe enum conversion
    if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
    {
        return ServiceResult<UpdateAdminRoleResponseDto>.Fail("Invalid role");
    }

    admin.Role = role;

    await _repo.Update(admin);

    return ServiceResult<UpdateAdminRoleResponseDto>.Ok(new UpdateAdminRoleResponseDto
    {
        Id = admin.Id,
        Role = admin.Role.ToString(),
        Message = "Role updated successfully"
    });
}


private string GenerateOtp()
{
    var bytes = new byte[4];
    System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
    var number = BitConverter.ToUInt32(bytes, 0) % 900000 + 100000;
    return number.ToString();
}

public async Task<ServiceResult<string>> ForgotPassword(ForgotPasswordDto dto)
{
    var admin = await _repo.GetByEmail(dto.Email);

    if (admin == null)
        return ServiceResult<string>.Fail("Admin not found");

    var otp = GenerateOtp();

    //Console.WriteLine("============== OTP DEBUG ==============");
    //Console.WriteLine($"Email: {admin.Email}");
    //Console.WriteLine($"OTP: {otp}");
    //Console.WriteLine("=======================================");
    
    admin.ResetOtpHash = BCrypt.Net.BCrypt.HashPassword(otp);
    Console.WriteLine($"OTP Hash: {admin.ResetOtpHash}");
    admin.ResetOtpExpiry = _dateTimeProvider.Now.AddMinutes(3);

    await _repo.Update(admin);

    await _email.SendEmail(
        admin.Email!,
        "Your OTP Code",
        $"Your OTP is: {otp}\nExpires in 3 minutes."
    );
    return ServiceResult<string>.Ok(otp);
}


public async Task<ServiceResult<bool>> ResetPassword(ResetPasswordDto dto)
{
    var admin = await _repo.GetByEmail(dto.Email);

    if (admin == null)
        return ServiceResult<bool>.Fail("Admin not found");

    // check OTP expiry
    if (admin.ResetOtpExpiry == null || admin.ResetOtpExpiry < _dateTimeProvider.Now)
        return ServiceResult<bool>.Fail("OTP has expired");

    // check OTP exists
    if (string.IsNullOrEmpty(admin.ResetOtpHash))
        return ServiceResult<bool>.Fail("Invalid OTP");

    // validate OTP HERE (only place)
    bool isValid = BCrypt.Net.BCrypt.Verify(dto.Otp, admin.ResetOtpHash);

    if (!isValid)
        return ServiceResult<bool>.Fail("Invalid OTP");

    // check password match
    if (dto.NewPassword != dto.ConfirmPassword)
        return ServiceResult<bool>.Fail("Passwords do not match");

    // update password
    admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

    // clear OTP data
    admin.ResetOtpHash = null;
    admin.ResetOtpExpiry = null;

    await _repo.Update(admin);

    return ServiceResult<bool>.Ok(true);
}


}
}