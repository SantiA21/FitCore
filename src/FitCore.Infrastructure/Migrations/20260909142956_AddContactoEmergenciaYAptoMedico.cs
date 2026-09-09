using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContactoEmergenciaYAptoMedico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "AptoMedicoVence",
                table: "AspNetUsers",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactoEmergenciaNombre",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactoEmergenciaRelacion",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactoEmergenciaTelefono",
                table: "AspNetUsers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AptoMedicoVence",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ContactoEmergenciaNombre",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ContactoEmergenciaRelacion",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ContactoEmergenciaTelefono",
                table: "AspNetUsers");
        }
    }
}
