using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FitCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ActualizaModelo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asistencias_Clientes_ClienteId",
                table: "Asistencias");

            migrationBuilder.DropForeignKey(
                name: "FK_Membresias_Clientes_ClienteId",
                table: "Membresias");

            migrationBuilder.DropForeignKey(
                name: "FK_Pagos_Clientes_ClienteId",
                table: "Pagos");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropIndex(
                name: "IX_Pagos_ClienteId",
                table: "Pagos");

            migrationBuilder.DropIndex(
                name: "IX_Membresias_ClienteId",
                table: "Membresias");

            migrationBuilder.DropIndex(
                name: "IX_Asistencias_ClienteId",
                table: "Asistencias");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Membresias");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Asistencias");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Pagos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Membresias",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Categoria",
                table: "AspNetUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PlanId",
                table: "AspNetUsers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "AspNetUsers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Asistencias",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_UserId",
                table: "Pagos",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Membresias_UserId",
                table: "Membresias",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_PlanId",
                table: "AspNetUsers",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Asistencias_UserId",
                table: "Asistencias",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Asistencias_AspNetUsers_UserId",
                table: "Asistencias",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Planes_PlanId",
                table: "AspNetUsers",
                column: "PlanId",
                principalTable: "Planes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Membresias_AspNetUsers_UserId",
                table: "Membresias",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Pagos_AspNetUsers_UserId",
                table: "Pagos",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Asistencias_AspNetUsers_UserId",
                table: "Asistencias");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Planes_PlanId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_Membresias_AspNetUsers_UserId",
                table: "Membresias");

            migrationBuilder.DropForeignKey(
                name: "FK_Pagos_AspNetUsers_UserId",
                table: "Pagos");

            migrationBuilder.DropIndex(
                name: "IX_Pagos_UserId",
                table: "Pagos");

            migrationBuilder.DropIndex(
                name: "IX_Membresias_UserId",
                table: "Membresias");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_PlanId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_Asistencias_UserId",
                table: "Asistencias");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Pagos");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Membresias");

            migrationBuilder.DropColumn(
                name: "Categoria",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PlanId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Asistencias");

            migrationBuilder.AddColumn<int>(
                name: "ClienteId",
                table: "Pagos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ClienteId",
                table: "Membresias",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ClienteId",
                table: "Asistencias",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlanId = table.Column<int>(type: "integer", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    FechaAlta = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Telefono = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clientes_Planes_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Planes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pagos_ClienteId",
                table: "Pagos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Membresias_ClienteId",
                table: "Membresias",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Asistencias_ClienteId",
                table: "Asistencias",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_PlanId",
                table: "Clientes",
                column: "PlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Asistencias_Clientes_ClienteId",
                table: "Asistencias",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Membresias_Clientes_ClienteId",
                table: "Membresias",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Pagos_Clientes_ClienteId",
                table: "Pagos",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
