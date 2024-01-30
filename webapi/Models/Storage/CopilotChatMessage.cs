﻿// Copyright (c) Microsoft. All rights reserved.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using CopilotChat.WebApi.Models.Response;
using CopilotChat.WebApi.Storage;

namespace CopilotChat.WebApi.Models.Storage;

/// <summary>
/// Information about a single chat message.
/// </summary>
public class CopilotChatMessage : IStorageEntity
{
    private static readonly JsonSerializerOptions SerializerSettings = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    /// <summary>
    /// Role of the author of a chat message.
    /// </summary>
    public enum AuthorRoles
    {
        /// <summary>
        /// The current user of the chat.
        /// </summary>
        User = 0,

        /// <summary>
        /// The bot.
        /// </summary>
        Bot
    }

    /// <summary>
    /// Type of the chat message.
    /// </summary>
    public enum ChatMessageType
    {
        /// <summary>
        /// A standard message
        /// </summary>
        Message,

        /// <summary>
        /// A message for a Plan
        /// </summary>
        Plan,

        /// <summary>
        /// An uploaded document notification
        /// </summary>
        Document,

        /// <summary>
        /// An document memory removal notification
        /// </summary>
        DocumentRemoval,
    }

    /// <summary>
    /// Timestamp of the message.
    /// </summary>
    public DateTimeOffset Timestamp { get; set; }

    /// <summary>
    /// Id of the user who sent this message.
    /// </summary>
    public string UserId { get; set; }

    /// <summary>
    /// Name of the user who sent this message.
    /// </summary>
    public string UserName { get; set; }

    /// <summary>
    /// Id of the chat this message belongs to.
    /// </summary>
    public string ChatId { get; set; }

    /// <summary>
    /// Content of the message.
    /// </summary>
    public string Content { get; set; }

    /// <summary>
    /// Id of the message.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Role of the author of the message.
    /// </summary>
    public AuthorRoles AuthorRole { get; set; }

    /// <summary>
    /// Prompt used to generate the message.
    /// Will be empty if the message is not generated by a prompt.
    /// </summary>
    public string Prompt { get; set; } = string.Empty;

    /// <summary>
    /// Citations of the message.
    /// </summary>
    public IEnumerable<CitationSource>? Citations { get; set; }

    /// <summary>
    /// Type of the message.
    /// </summary>
    public ChatMessageType Type { get; set; }

    /// <summary>
    /// Counts of total token usage used to generate bot response.
    /// </summary>
    public IDictionary<string, int>? TokenUsage { get; set; }

    /// <summary>
    /// The partition key for the source.
    /// </summary>
    [JsonIgnore]
    public string Partition => this.ChatId;

    /// <summary>
    /// Create a new chat message. Timestamp is automatically generated.
    /// </summary>
    /// <param name="userId">Id of the user who sent this message</param>
    /// <param name="userName">Name of the user who sent this message</param>
    /// <param name="chatId">The chat ID that this message belongs to</param>
    /// <param name="content">The message</param>
    /// <param name="prompt">The prompt used to generate the message</param>
    /// <param name="authorRole">Role of the author</param>
    /// <param name="type">Type of the message</param>
    /// <param name="tokenUsage">Total token usages used to generate bot response</param>
    public CopilotChatMessage(
        string userId,
        string userName,
        string chatId,
        string content,
        string? prompt = null,
        IEnumerable<CitationSource>? citations = null,
        AuthorRoles authorRole = AuthorRoles.User,
        ChatMessageType type = ChatMessageType.Message,
        IDictionary<string, int>? tokenUsage = null)
    {
        this.Timestamp = DateTimeOffset.Now;
        this.UserId = userId;
        this.UserName = userName;
        this.ChatId = chatId;
        this.Content = content;
        this.Id = Guid.NewGuid().ToString();
        this.Prompt = prompt ?? string.Empty;
        this.Citations = citations;
        this.AuthorRole = authorRole;
        this.Type = type;
        this.TokenUsage = tokenUsage;
    }

    /// <summary>
    /// Create a new chat message for the bot response.
    /// </summary>
    /// <param name="chatId">The chat ID that this message belongs to</param>
    /// <param name="content">The message</param>
    /// <param name="prompt">The prompt used to generate the message</param>
    /// <param name="tokenUsage">Total token usage of response completion</param>
    public static CopilotChatMessage CreateBotResponseMessage(string chatId, string content, string prompt, IEnumerable<CitationSource>? citations, IDictionary<string, int>? tokenUsage = null)
    {
        return new CopilotChatMessage("Bot", "Bot", chatId, content, prompt, citations, AuthorRoles.Bot, IsPlan(content) ? ChatMessageType.Plan : ChatMessageType.Message, tokenUsage);
    }

    /// <summary>
    /// Create a new chat message for a document upload.
    /// </summary>
    /// <param name="userId">The user ID that uploaded the document</param>
    /// <param name="userName">The user name that uploaded the document</param>
    /// <param name="chatId">The chat ID that this message belongs to</param>
    /// <param name="documentMessageContent">The document message content</param>
    public static CopilotChatMessage CreateDocumentMessage(string userId, string userName, string chatId, DocumentMessageContent documentMessageContent)
    {
        return new CopilotChatMessage(userId, userName, chatId, documentMessageContent.ToString(), string.Empty, null, AuthorRoles.User, ChatMessageType.Document);
    }

    /// <summary>
    /// Serialize the object to a formatted string.
    /// </summary>
    /// <returns>A formatted string</returns>
    public string ToFormattedString()
    {
        var messagePrefix = $"[{this.Timestamp.ToString("G", CultureInfo.CurrentCulture)}]";
        switch (this.Type)
        {
            case ChatMessageType.Plan:
            {
                var planMessageContent = "proposed a plan.";
                if (this.Content.Contains("proposedPlan\":", StringComparison.InvariantCultureIgnoreCase))
                {
                    // Try to extract user intent from the plan proposal.
                    string pattern = ".*User Intent:User intent: (.*)(?=\"})";
                    Match match = Regex.Match(this.Content, pattern);
                    if (match.Success)
                    {
                        string userIntent = match.Groups[1].Value.Trim();
                        planMessageContent = $"proposed a plan to fulfill user intent: {userIntent}";
                    }
                }

                return $"{messagePrefix} {this.UserName} {planMessageContent}";
            }

            case ChatMessageType.Document:
            {
                var documentMessage = DocumentMessageContent.FromString(this.Content);
                var documentMessageContent = (documentMessage != null) ? documentMessage.ToFormattedString() : "documents";

                return $"{messagePrefix} {this.UserName} uploaded: {documentMessageContent}";
            }

            case ChatMessageType.DocumentRemoval:
            {
                var documentMessage = DocumentMessageContent.FromString(this.Content);
                var documentMessageContent = (documentMessage != null) ? documentMessage.ToFormattedString() : "documents";

                return $"{messagePrefix} {this.UserName} document removal: {documentMessageContent}";
            }

            case ChatMessageType.Message:
            {
                return $"{messagePrefix} {this.UserName} said: {this.Content}";
            }

            default:
            {
                // This should never happen.
                throw new InvalidOperationException($"Unknown message type: {this.Type}");
            }
        }
    }

    /// <summary>
    /// Serialize the object to a JSON string.
    /// </summary>
    /// <returns>A serialized json string</returns>
    public override string ToString()
    {
        return JsonSerializer.Serialize(this, SerializerSettings);
    }

    /// <summary>
    /// Deserialize a JSON string to a ChatMessage object.
    /// </summary>
    /// <param name="json">A json string</param>
    /// <returns>A ChatMessage object</returns>
    public static CopilotChatMessage? FromString(string json)
    {
        return JsonSerializer.Deserialize<CopilotChatMessage>(json, SerializerSettings);
    }

    /// <summary>
    /// Check if the response is a Plan.
    /// This is a copy of the `isPlan` function on the frontend.
    /// </summary>
    /// <param name="response">The response from the bot.</param>
    /// <returns>True if the response represents  Plan, false otherwise.</returns>
    private static bool IsPlan(string response)
    {
        var planPrefix = "proposedPlan\":";
        return response.Contains(planPrefix, StringComparison.InvariantCulture);
    }
}
