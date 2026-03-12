using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using SimpleRedirects.Core.Enums;
using SimpleRedirects.Core.Models;

namespace SimpleRedirects.Core.Services;

public class ExcelImportExportService : IImportExportService
{
    private readonly RedirectRepository _redirectRepository;

    public ExcelImportExportService(RedirectRepository redirectRepository)
    {
        _redirectRepository = redirectRepository;
    }

    public DataRecordCollectionFile ExportDataRecordCollection()
    {
        var records = _redirectRepository.GetAllRedirects();
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Redirect list");

        // Header row
        worksheet.Cell(1, 1).Value = "IsRegex";
        worksheet.Cell(1, 2).Value = "OldUrl";
        worksheet.Cell(1, 3).Value = "NewUrl";
        worksheet.Cell(1, 4).Value = "RedirectCode";
        worksheet.Cell(1, 5).Value = "Notes";

        // Data rows
        var row = 2;
        foreach (var r in records)
        {
            worksheet.Cell(row, 1).Value = r.IsRegex;
            worksheet.Cell(row, 2).Value = r.OldUrl;
            worksheet.Cell(row, 3).Value = r.NewUrl;
            worksheet.Cell(row, 4).Value = r.RedirectCode;
            worksheet.Cell(row, 5).Value = r.Notes;
            row++;
        }

        using var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        return new DataRecordCollectionFile(DataRecordProvider.Excel, memoryStream.ToArray());
    }

    public ImportRedirectsResponse ImportRedirectsFromCollection(IFormFile file, bool overwriteMatches)
    {
        if (file.Length <= 0) return ImportRedirectsResponse.EmptyImportRecordResponse();

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.First();

        var records = new List<Redirect>();
        var headerRow = worksheet.FirstRowUsed();
        if (headerRow == null) return ImportRedirectsResponse.EmptyImportRecordResponse();

        // Map header names to column indices
        var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in headerRow.CellsUsed())
        {
            headers[cell.GetString().Trim()] = cell.Address.ColumnNumber;
        }

        foreach (var row in worksheet.RowsUsed().Skip(1))
        {
            var redirect = new Redirect
            {
                IsRegex = headers.ContainsKey("IsRegex") && bool.TryParse(row.Cell(headers["IsRegex"]).GetString(), out var isRegex) && isRegex,
                OldUrl = headers.ContainsKey("OldUrl") ? row.Cell(headers["OldUrl"]).GetString() : string.Empty,
                NewUrl = headers.ContainsKey("NewUrl") ? row.Cell(headers["NewUrl"]).GetString() : string.Empty,
                RedirectCode = headers.ContainsKey("RedirectCode") && int.TryParse(row.Cell(headers["RedirectCode"]).GetString(), out var code) ? code : 301,
                Notes = headers.ContainsKey("Notes") ? row.Cell(headers["Notes"]).GetString() : string.Empty,
            };
            records.Add(redirect);
        }

        if (!records.Any()) return ImportRedirectsResponse.EmptyImportRecordResponse();

        var addedRedirects = 0;
        var updatedRedirects = 0;
        var existingRedirects = 0;
        var errorList = new List<Redirect>();

        foreach (var redirect in records)
        {
            if (_redirectRepository.FetchRedirectByOldUrl(redirect.OldUrl) is not { } existingRedirect)
            {
                try
                {
                    _redirectRepository.AddRedirect(redirect.IsRegex, redirect.OldUrl, redirect.NewUrl, redirect.RedirectCode, redirect.Notes);
                    addedRedirects++;
                }
                catch (ArgumentException e)
                {
                    redirect.Notes = e.Message;
                    errorList.Add(redirect);
                }
            }
            else if (overwriteMatches && !existingRedirect.Equals(redirect))
            {
                redirect.Id = existingRedirect.Id;
                try
                {
                    _redirectRepository.UpdateRedirect(redirect);
                    updatedRedirects++;
                }
                catch (ArgumentException e)
                {
                    redirect.Notes = e.Message;
                    errorList.Add(redirect);
                }
            }
            else
                existingRedirects++;
        }

        return ImportRedirectsResponse.FromImport(addedRedirects, updatedRedirects, existingRedirects, errorList.ToArray());
    }
}
