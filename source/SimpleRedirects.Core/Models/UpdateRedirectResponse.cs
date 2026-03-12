using System.Text.Json.Serialization;

namespace SimpleRedirects.Core.Models
{
    public class UpdateRedirectResponse : BaseResponse
    {
        [JsonPropertyName("updatedRedirect")]
        public Redirect UpdatedRedirect { get; set; }
    }
}
