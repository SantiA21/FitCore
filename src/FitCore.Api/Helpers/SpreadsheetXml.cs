using System.Globalization;
using System.Text;

namespace FitCore.Api.Helpers;

/// <summary>
/// Genera archivos en formato SpreadsheetML (XML) que Excel abre nativamente
/// con doble clic, sin pasar por el asistente de "importar XML".
/// </summary>
public static class SpreadsheetXml
{
    public static string Build(string sheetName, IReadOnlyList<string> headers, IEnumerable<IReadOnlyList<object?>> rows)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<?mso-application progid=\"Excel.Sheet\"?>");
        sb.AppendLine("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">");
        sb.Append("<Worksheet ss:Name=\"").Append(Escape(sheetName)).AppendLine("\">");
        sb.AppendLine("<Table>");

        sb.AppendLine("<Row>");
        foreach (var h in headers)
        {
            sb.Append("<Cell><Data ss:Type=\"String\">").Append(Escape(h)).AppendLine("</Data></Cell>");
        }
        sb.AppendLine("</Row>");

        foreach (var row in rows)
        {
            sb.AppendLine("<Row>");
            foreach (var value in row)
            {
                var (type, text) = FormatCell(value);
                sb.Append("<Cell><Data ss:Type=\"").Append(type).Append("\">").Append(Escape(text)).AppendLine("</Data></Cell>");
            }
            sb.AppendLine("</Row>");
        }

        sb.AppendLine("</Table>");
        sb.AppendLine("</Worksheet>");
        sb.AppendLine("</Workbook>");
        return sb.ToString();
    }

    private static (string Type, string Text) FormatCell(object? value) => value switch
    {
        null => ("String", ""),
        int i => ("Number", i.ToString(CultureInfo.InvariantCulture)),
        decimal d => ("Number", d.ToString(CultureInfo.InvariantCulture)),
        double d => ("Number", d.ToString(CultureInfo.InvariantCulture)),
        DateOnly d => ("DateTime", d.ToString("yyyy-MM-dd") + "T00:00:00"),
        DateTime d => ("DateTime", d.ToString("yyyy-MM-ddTHH:mm:ss")),
        _ => ("String", value.ToString() ?? "")
    };

    private static string Escape(string s) =>
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;").Replace("'", "&apos;");
}
