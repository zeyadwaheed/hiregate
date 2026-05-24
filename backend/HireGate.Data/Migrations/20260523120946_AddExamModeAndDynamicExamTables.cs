using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace HireGate.Data.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExamModeAndDynamicExamTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "mode",
                table: "exams",
                type: "varchar(20)",
                nullable: false,
                defaultValue: "static");

            migrationBuilder.CreateTable(
                name: "candidate_exam_questions",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    candidate_id = table.Column<int>(type: "int", nullable: false),
                    question_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_candidate_exam_questions", x => x.id);
                    table.ForeignKey(
                        name: "FK_candidate_exam_questions_candidates_candidate_id",
                        column: x => x.candidate_id,
                        principalTable: "candidates",
                        principalColumn: "candidate_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_candidate_exam_questions_questions_question_id",
                        column: x => x.question_id,
                        principalTable: "questions",
                        principalColumn: "question_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "exam_topic_rules",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    exam_id = table.Column<int>(type: "int", nullable: false),
                    topic_id = table.Column<int>(type: "int", nullable: false),
                    question_count = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exam_topic_rules", x => x.id);
                    table.ForeignKey(
                        name: "FK_exam_topic_rules_exams_exam_id",
                        column: x => x.exam_id,
                        principalTable: "exams",
                        principalColumn: "exam_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_exam_topic_rules_topics_topic_id",
                        column: x => x.topic_id,
                        principalTable: "topics",
                        principalColumn: "topic_id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.AddCheckConstraint(
                name: "CK_exams_mode",
                table: "exams",
                sql: "mode IN ('static', 'dynamic', 'hybrid')");

            migrationBuilder.CreateIndex(
                name: "IX_candidate_exam_questions_candidate_id",
                table: "candidate_exam_questions",
                column: "candidate_id");

            migrationBuilder.CreateIndex(
                name: "IX_candidate_exam_questions_question_id",
                table: "candidate_exam_questions",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "IX_exam_topic_rules_exam_id",
                table: "exam_topic_rules",
                column: "exam_id");

            migrationBuilder.CreateIndex(
                name: "IX_exam_topic_rules_topic_id",
                table: "exam_topic_rules",
                column: "topic_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "candidate_exam_questions");

            migrationBuilder.DropTable(
                name: "exam_topic_rules");

            migrationBuilder.DropCheckConstraint(
                name: "CK_exams_mode",
                table: "exams");

            migrationBuilder.DropColumn(
                name: "mode",
                table: "exams");
        }
    }
}
