using System.Text.Json.Serialization;

namespace SimpleRedirects.Core.Models;

public abstract class BaseResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; }
}
