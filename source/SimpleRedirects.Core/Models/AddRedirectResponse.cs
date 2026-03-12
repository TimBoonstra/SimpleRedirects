using System.Text.Json.Serialization;

namespace SimpleRedirects.Core.Models
{
    public class AddRedirectResponse : BaseResponse
    {
        [JsonPropertyName("newRedirect")]
        public Redirect NewRedirect { get; set; }
    }
}
