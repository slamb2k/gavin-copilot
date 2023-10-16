// Copyright (c) Microsoft. All rights reserved.

import { IChatMessage } from '../models/ChatMessage';
import { ServiceInfo } from '../models/ServiceInfo';
import { BaseService } from './BaseService';

/**
 * Scope of the document. This determines the collection name in the document memory.
 */
export enum DocumentScopes {
    // The document is not associated with a chat and available to all users.
    Global,

    // The document is associated with a sopecific chat and user.
    Chat
}

export class DocumentImportService extends BaseService {
    public importDocumentAsync = async (
        chatId: string,
        documents: File[],
        scope: DocumentScopes,
        useContentSafety: boolean,
        accessToken: string,
    ) => {
        const formData = new FormData();
        formData.append('useContentSafety', useContentSafety.toString());
        for (const document of documents) {
            formData.append('formFiles', document);
        }

        return await this.getResponseAsync<IChatMessage>(
            {
                commandPath: (scope === DocumentScopes.Global) ?
                    `documents` :
                    `chats/${chatId}/documents`,
                method: 'POST',
                body: formData,
            },
            accessToken,
        );
    };

    public getContentSafetyStatusAsync = async (accessToken: string): Promise<boolean> => {
        const serviceInfo = await this.getResponseAsync<ServiceInfo>(
            {
                commandPath: 'info',
                method: 'GET',
            },
            accessToken,
        );

        return serviceInfo.isContentSafetyEnabled;
    };
}
