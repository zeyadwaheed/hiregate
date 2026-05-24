using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireGate.Data.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEmailUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Candidates_Email",
                table: "candidates");

            migrationBuilder.CreateIndex(
                name: "UX_Candidates_Email",
                table: "candidates",
                column: "email");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Candidates_Email",
                table: "candidates");

            migrationBuilder.CreateIndex(
                name: "UX_Candidates_Email",
                table: "candidates",
                column: "email",
                unique: true);
        }
    }
}
