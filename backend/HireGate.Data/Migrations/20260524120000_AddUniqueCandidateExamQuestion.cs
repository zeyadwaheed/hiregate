using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireGate.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueCandidateExamQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE duplicate_candidate_question
                FROM candidate_exam_questions duplicate_candidate_question
                INNER JOIN candidate_exam_questions first_candidate_question
                    ON duplicate_candidate_question.candidate_id = first_candidate_question.candidate_id
                    AND duplicate_candidate_question.question_id = first_candidate_question.question_id
                    AND duplicate_candidate_question.id > first_candidate_question.id
                """);

            migrationBuilder.CreateIndex(
                name: "UX_candidate_exam_questions_candidate_question",
                table: "candidate_exam_questions",
                columns: new[] { "candidate_id", "question_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_candidate_exam_questions_candidate_question",
                table: "candidate_exam_questions");
        }
    }
}
