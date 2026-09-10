using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FitCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGymSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GymSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NombreGimnasio = table.Column<string>(type: "text", nullable: true),
                    LogoBase64 = table.Column<string>(type: "text", nullable: true),
                    FaviconBase64 = table.Column<string>(type: "text", nullable: true),
                    ColorPrimario = table.Column<string>(type: "text", nullable: true),
                    ColorSecundario = table.Column<string>(type: "text", nullable: true),
                    ColorAcento = table.Column<string>(type: "text", nullable: true),
                    BorderRadius = table.Column<string>(type: "text", nullable: false),
                    FontFamily = table.Column<string>(type: "text", nullable: false),
                    MensajeBienvenida = table.Column<string>(type: "text", nullable: true),
                    Telefono = table.Column<string>(type: "text", nullable: true),
                    Whatsapp = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    InstagramUrl = table.Column<string>(type: "text", nullable: true),
                    FacebookUrl = table.Column<string>(type: "text", nullable: true),
                    TiktokUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GymSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GymSettings");
        }
    }
}
