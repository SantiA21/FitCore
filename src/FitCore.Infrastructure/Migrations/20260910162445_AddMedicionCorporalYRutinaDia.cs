using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FitCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicionCorporalYRutinaDia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MedicionesCorporales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    PesoKg = table.Column<decimal>(type: "numeric", nullable: false),
                    Nota = table.Column<string>(type: "text", nullable: true),
                    FotoFrenteBase64 = table.Column<string>(type: "text", nullable: true),
                    FotoPerfilBase64 = table.Column<string>(type: "text", nullable: true),
                    RegistradoPorUserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicionesCorporales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedicionesCorporales_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RutinasDia",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    DiaSemana = table.Column<int>(type: "integer", nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: false),
                    ActualizadoEn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RutinasDia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RutinasDia_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MedicionesCorporales_UserId",
                table: "MedicionesCorporales",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RutinasDia_UserId_DiaSemana",
                table: "RutinasDia",
                columns: new[] { "UserId", "DiaSemana" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MedicionesCorporales");

            migrationBuilder.DropTable(
                name: "RutinasDia");
        }
    }
}
