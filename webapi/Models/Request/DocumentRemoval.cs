// Copyright (c) Microsoft. All rights reserved.

using System;

namespace CopilotChat.WebApi.Models.Request;

/// <summary>
/// Form for removing one or more document memories.
/// </summary>
public class DocumentRemoval
{
    /// <summary>
    /// The unique ID of the document memory.
    /// </summary>
    public Guid Id { get; set; } = Guid.Empty;

    /// <summary>
    /// The name of the document memory.
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Scope of the document memory.
    /// </summary>
    public DocumentScopes DocumentScope
    {
        get { return (this.ChatId == Guid.Empty) ? DocumentScopes.Global : DocumentScopes.Chat; }
    }

    /// <summary>
    /// The ID of the chat that owns the document.
    /// This is used to create a unique collection name for the chat.
    /// If the chat ID is not specified or empty, the documents will be stored in a global collection.
    /// If the document scope is set to global, this value is ignored.
    /// </summary>
    public Guid ChatId { get; set; } = Guid.Empty;
}
