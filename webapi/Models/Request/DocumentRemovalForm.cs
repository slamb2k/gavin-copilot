// Copyright (c) Microsoft. All rights reserved.

using System.Collections.Generic;
using System.Linq;

namespace CopilotChat.WebApi.Models.Request;

/// <summary>
/// Form for removing one or more document memories.
/// </summary>
public class DocumentRemovalForm
{
    /// <summary>
    /// The document memories to remove.
    /// </summary>
    public IEnumerable<DocumentRemoval> DocumentRemovals { get; set; } = Enumerable.Empty<DocumentRemoval>();
}
