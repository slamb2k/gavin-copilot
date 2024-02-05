// Copyright (c) Microsoft. All rights reserved.

using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using CopilotChat.WebApi.Models.Request;

namespace CopilotChat.WebApi.Models.Response;

/// <summary>
/// Value of `Content` for a `ChatMessage` of type `ChatMessageType.DocumentRemoval`.
/// </summary>
public class DocumentRemovalResponse
{
    /// <summary>
    /// List of document removals contained in the message.
    /// </summary>
    [JsonPropertyName("documents")]
    public IEnumerable<DocumentRemovalData> DocumentRemovals { get; set; } = Enumerable.Empty<DocumentRemovalData>();

    /// <summary>
    /// Add a document to the list of removals.
    /// </summary>
    /// <param name="name">Name of the document being removed</param>
    /// <param name="isRemoved">Status of the document removal</param>
    public void AddDocument(string name, bool isRemoved)
    {
        this.DocumentRemovals = this.DocumentRemovals.Append(new DocumentRemovalData
        {
            Name = name,
            IsRemoved = isRemoved,
        });
    }

    /// <summary>
    /// Serialize the object to a JSON string.
    /// </summary>
    /// <returns>A serialized JSON string</returns>
    public override string ToString()
    {
        return JsonSerializer.Serialize(this);
    }

    /// <summary>
    /// Serialize the object to a formatted string.
    /// Only successful removals will be included in the formatted string.
    /// </summary>
    /// <returns>A formatted string</returns>
    public string ToFormattedString()
    {
        if (!this.DocumentRemovals.Any())
        {
            return string.Empty;
        }

        var formattedStrings = this.DocumentRemovals
            .Where(document => document.IsRemoved)
            .Select(document => document.Name).ToList();

        if (formattedStrings.Count == 1)
        {
            return formattedStrings.First();
        }

        return string.Join(",\n", formattedStrings);
    }

    /// <summary>
    /// Serialize the object to a formatted string that only
    /// contains document names separated by comma.
    /// </summary>
    /// <returns>A formatted string</returns>
    public string ToFormattedStringNamesOnly()
    {
        if (!this.DocumentRemovals.Any())
        {
            return string.Empty;
        }

        var formattedStrings = this.DocumentRemovals
            .Where(document => document.IsRemoved)
            .Select(document => document.Name).ToList();

        if (formattedStrings.Count == 1)
        {
            return formattedStrings.First();
        }

        return string.Join(",\n", formattedStrings);
    }

    /// <summary>
    /// Deserialize a JSON string to a DocumentRemovalResponse object.
    /// </summary>
    /// <param name="json">A JSON string</param>
    /// <returns>A DocumentRemovalResponse object</returns>
    public static DocumentRemovalResponse? FromString(string json)
    {
        return JsonSerializer.Deserialize<DocumentRemovalResponse>(json);
    }
}
