using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitCore.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGymIdFromPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GymId",
                table: "Planes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GymId",
                table: "Planes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }
    }
}
