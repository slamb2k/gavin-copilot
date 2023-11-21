// Copyright (c) Microsoft. All rights reserved.

import { Citation, IChatMessage } from '../models/ChatMessage';
import { ServiceInfo } from '../models/ServiceInfo';
import { BaseService } from './BaseService';

/**
 * Scope of the document. This determines the collection name in the document memory.
 */
export enum DocumentScopes {
    // The document is not associated with a chat and available to all users.
    Global,

    // The document is associated with a sopecific chat and user.
    Chat,
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
                commandPath: scope === DocumentScopes.Global ? `documents` : `chats/${chatId}/documents`,
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

    public downloadCitedDocument = async (citation: Citation, openFile = true, accessToken: string): Promise<void> => {
        const payload = {
            Link: citation.link,
            SourceName: citation.sourceName,
            SourceContentType: citation.sourceContentType,
        };

        try {
            const requestUrl = new URL('documents/getcitation', this.serviceUrl);
            await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            })
                .then((response) => response.blob())
                .then((blob) => {
                    const blobURL = URL.createObjectURL(blob);

                    if (openFile) {
                        window.open(blobURL);
                    } else {
                        const link = document.createElement('a');
                        link.href = blobURL;
                        link.download = citation.sourceName;

                        document.body.appendChild(link);
                        link.click();
                        link.parentNode?.removeChild(link);
                    }

                    URL.revokeObjectURL(blobURL);
                });
        } catch (e: any) {
            let additionalErrorMsg = '';
            if (e instanceof TypeError) {
                // fetch() will reject with a TypeError when a network error is encountered.
                additionalErrorMsg =
                    '\n\nPlease check that your backend is running and that it is accessible by the app';
            }
            throw Object.assign(new Error(`${e as string} ${additionalErrorMsg}`));
        }
    };
}
