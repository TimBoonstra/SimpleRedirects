using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SimpleRedirects.Core.Enums;
using SimpleRedirects.Core.Extensions;
using SimpleRedirects.Core.Models;
using SimpleRedirects.Core.Services;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;

namespace SimpleRedirects.Core
{
    [VersionedApiBackOfficeRoute("simple-redirects")]
    [ApiExplorerSettings(GroupName = "Simple Redirects API")]
    public class RedirectApiController : ManagementApiControllerBase
    {
        private readonly RedirectRepository _redirectRepository;
        private readonly ImportExportFactory _importExportFactory;

        public RedirectApiController(RedirectRepository redirectRepository, ImportExportFactory importExportFactory)
        {
            _redirectRepository = redirectRepository;
            _importExportFactory = importExportFactory;
        }

        [HttpGet("redirects")]
        [ProducesResponseType<IEnumerable<Redirect>>(StatusCodes.Status200OK)]
        public IActionResult GetAll()
        {
            return Ok(_redirectRepository.GetAllRedirects());
        }

        [HttpPost("redirect")]
        [ProducesResponseType<AddRedirectResponse>(StatusCodes.Status200OK)]
        public IActionResult Add([FromBody] AddRedirectRequest request)
        {
            if (request == null) return Ok(new AddRedirectResponse() { Success = false, Message = "Request was empty" });
            if (!ModelState.IsValid)
                return Ok(new AddRedirectResponse() { Success = false, Message = "Missing required attributes" });

            try
            {
                var redirect = _redirectRepository.AddRedirect(request.IsRegex, request.OldUrl, request.NewUrl,
                    request.RedirectCode, request.Notes);
                return Ok(new AddRedirectResponse() { Success = true, NewRedirect = redirect });
            }
            catch (Exception e)
            {
                return Ok(new AddRedirectResponse()
                    { Success = false, Message = "There was an error adding the redirect : " + e.Message });
            }
        }

        [HttpPut("redirect")]
        [ProducesResponseType<UpdateRedirectResponse>(StatusCodes.Status200OK)]
        public IActionResult Update([FromBody] UpdateRedirectRequest request)
        {
            if (request == null) return Ok(new UpdateRedirectResponse() { Success = false, Message = "Request was empty" });
            if (!ModelState.IsValid)
                return Ok(new UpdateRedirectResponse() { Success = false, Message = "Missing required attributes" });

            try
            {
                var redirect = _redirectRepository.UpdateRedirect(request.Redirect);
                return Ok(new UpdateRedirectResponse() { Success = true, UpdatedRedirect = redirect });
            }
            catch (Exception e)
            {
                return Ok(new UpdateRedirectResponse()
                    { Success = false, Message = "There was an error updating the redirect : " + e.Message });
            }
        }

        [HttpDelete("redirect/{id:int}")]
        [ProducesResponseType<DeleteRedirectResponse>(StatusCodes.Status200OK)]
        public IActionResult Delete(int id)
        {
            if (id == 0)
                return Ok(new DeleteRedirectResponse()
                    { Success = false, Message = "Invalid ID passed for redirect to delete" });

            try
            {
                _redirectRepository.DeleteRedirect(id);
                return Ok(new DeleteRedirectResponse() { Success = true });
            }
            catch (Exception e)
            {
                return Ok(new DeleteRedirectResponse()
                    { Success = false, Message = "There was an error deleting the redirect : " + e.Message });
            }
        }

        [HttpDelete("redirects")]
        [ProducesResponseType<DeleteRedirectResponse>(StatusCodes.Status200OK)]
        public IActionResult DeleteAll()
        {
            try
            {
                _redirectRepository.DeleteAllRedirects();
                return Ok(new DeleteRedirectResponse() { Success = true });
            }
            catch (Exception e)
            {
                return Ok(new DeleteRedirectResponse()
                    { Success = false, Message = "There was an error deleting the redirects : " + e.Message });
            }
        }

        [HttpPost("cache/clear")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult ClearCache()
        {
            _redirectRepository.ClearCache();
            return Ok();
        }

        [HttpGet("redirects/export")]
        public IActionResult ExportRedirects([FromQuery] DataRecordProvider dataRecordProvider)
        {
            var dataRecordCollectionFile = _importExportFactory.GetDataRecordProvider(dataRecordProvider)
                .ExportDataRecordCollection();

            return File(dataRecordCollectionFile.File, dataRecordCollectionFile.ContentType, dataRecordCollectionFile.FileName);
        }

        [HttpPost("redirects/import")]
        [ProducesResponseType<ImportRedirectsResponse>(StatusCodes.Status200OK)]
        public IActionResult ImportRedirects([FromQuery] bool overwriteMatches)
        {
            var file = HttpContext.Request.Form.Files.Any() ? HttpContext.Request.Form.Files[0] : null;
            if (file is null) return Ok(ImportRedirectsResponse.EmptyImportRecordResponse());
            if (!file.CanGetDataRecordProviderFromFile(out var provider))
                return Ok(ImportRedirectsResponse.EmptyImportRecordResponse(
                    "No redirects imported, provided file is not supported by the import process. Please provide a .csv or .xlsx file."));

            var response = _importExportFactory.GetDataRecordProvider(provider)
                .ImportRedirectsFromCollection(file, overwriteMatches);
            return Ok(response);
        }
    }
}
