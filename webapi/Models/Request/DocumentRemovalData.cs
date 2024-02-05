// Copyright (c) Microsoft. All rights reserved.

using System.Text.Json.Serialization;

namespace CopilotChat.WebApi.Models.Request;

public sealed class DocumentRemovalData
{
    /// <summary>
    /// Name of the removed document.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Status of the removed document.
    /// If true, the document is successfully removed. False otherwise.
    /// </summary>
    [JsonPropertyName("isRemoved")]
    public bool IsRemoved { get; set; } = false;
}
