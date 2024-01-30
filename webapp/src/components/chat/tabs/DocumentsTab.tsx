/* eslint-disable @typescript-eslint/no-misused-promises */ // $$$
// Copyright (c) Microsoft. All rights reserved.

import {
    Button,
    Label,
    Menu,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    Radio,
    RadioGroup,
    Spinner,
    TableRowId,
    Tooltip,
    makeStyles,
    shorthands,
    tokens,
} from '@fluentui/react-components';
import {
    Delete20Regular,
    DocumentArrowUp20Regular,
    DocumentPdfRegular,
    DocumentTextRegular,
    FluentIconsProps,
    GlobeAdd20Regular,
} from '@fluentui/react-icons';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react/lib/agGridReact';
import React, { useMemo, useRef, useState } from 'react';
import { Constants } from '../../../Constants';
import { useChat, useFile } from '../../../libs/hooks';
import { ChatMemorySource } from '../../../libs/models/ChatMemorySource';
import { useAppSelector } from '../../../redux/app/hooks';
import { RootState } from '../../../redux/app/store';
import { Add20 } from '../../shared/BundledIcons';
import { TabView } from './TabView';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

const EmptyGuid = '00000000-0000-0000-0000-000000000000';

const useClasses = makeStyles({
    functional: {
        display: 'flex',
        flexDirection: 'row',
        ...shorthands.margin('0', '0', tokens.spacingVerticalS, '0'),
    },
    uploadButton: {
        ...shorthands.margin('0', tokens.spacingHorizontalS, '0', '0'),
    },
    deleteButton: {
        ...shorthands.margin('0', tokens.spacingHorizontalS, '0', '0'),
    },
    vectorDatabase: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'baseline',
        marginLeft: 'auto',
        ...shorthands.gap(tokens.spacingHorizontalSNudge),
    },
    table: {
        backgroundColor: tokens.colorNeutralBackground1,
    },
    tableHeader: {
        fontWeight: tokens.fontSizeBase600,
    },
});

export const DocumentsTab: React.FC = () => {
    const classes = useClasses();
    const chat = useChat();
    const fileHandler = useFile();

    const { serviceInfo } = useAppSelector((state: RootState) => state.app);
    const { conversations, selectedId } = useAppSelector((state: RootState) => state.conversations);

    const { importingDocuments } = conversations[selectedId];

    const [resources, setResources] = React.useState<ChatMemorySource[]>([]);
    const [selected, setSelected] = React.useState(new Set<TableRowId>([1]));
    const localDocumentFileRef = useRef<HTMLInputElement | null>(null);
    const globalDocumentFileRef = useRef<HTMLInputElement | null>(null);

    //import en from 'javascript-time-ago/locale/en';

    const handleDelete = async (documentId: string, fileName: string, chatId: string) => {
        try {
            await fileHandler.deleteDocument(documentId, fileName, chatId);
            // Update the state immediately after deleting the file
            setResources((prevResources) => prevResources.filter((resource) => resource.id !== documentId));
        } catch (error) {
            console.error('Failed to delete the file:', error);
        }
    };

    const onDeleteClicked = async () => {
        const promises = Array.from(selected).map((id) =>
            handleDelete(
                id.toString(),
                resources.filter((resource) => resource.id === id)[0].name,
                resources.filter((resource) => resource.id === id)[0].chatId,
            ),
        );
        await Promise.all(promises);
        setSelected(new Set<TableRowId>());
    };

    return (
        <TabView
            title="Documents"
            learnMoreDescription="document embeddings"
            learnMoreLink="https://aka.ms/sk-docs-vectordb"
        >
            <div className={classes.functional}>
                {/* Hidden input for file upload. Only accepts importtypes for now. */}
                <input
                    type="file"
                    aria-label="Upload local chat document"
                    ref={localDocumentFileRef}
                    accept={Constants.app.importTypes}
                    style={{ display: 'none' }}
                    multiple={true}
                    onChange={() => {
                        void fileHandler.handleImport(selectedId, localDocumentFileRef, false);
                    }}
                />
                <input
                    type="file"
                    aria-label="Upload global document"
                    ref={globalDocumentFileRef}
                    accept={Constants.app.importTypes}
                    style={{ display: 'none' }}
                    multiple={true}
                    onChange={() => {
                        void fileHandler.handleImport(selectedId, globalDocumentFileRef, true);
                    }}
                />
                <Menu>
                    <MenuTrigger disableButtonEnhancement>
                        <Tooltip content="Embed file into chat session" relationship="label">
                            <Button
                                className={classes.uploadButton}
                                icon={<DocumentArrowUp20Regular />}
                                disabled={
                                    conversations[selectedId].disabled ||
                                    (importingDocuments && importingDocuments.length > 0)
                                }
                            >
                                Upload
                            </Button>
                        </Tooltip>
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            <MenuItem
                                data-testid="addNewLocalDoc"
                                onClick={() => localDocumentFileRef.current?.click()}
                                icon={<Add20 />}
                                disabled={
                                    conversations[selectedId].disabled ||
                                    (importingDocuments && importingDocuments.length > 0)
                                }
                            >
                                New local chat document
                            </MenuItem>
                            <MenuItem
                                data-testid="addNewLocalDoc"
                                onClick={() => globalDocumentFileRef.current?.click()}
                                icon={<GlobeAdd20Regular />}
                                disabled={
                                    conversations[selectedId].disabled ||
                                    (importingDocuments && importingDocuments.length > 0)
                                }
                            >
                                New global document
                            </MenuItem>
                        </MenuList>
                    </MenuPopover>
                </Menu>
                <Tooltip content="Delete selected documents from memory" relationship="label">
                    <Button
                        className={classes.deleteButton}
                        icon={<Delete20Regular />}
                        disabled={
                            (!serviceInfo.isDeleteDocumentEnabled && conversations[selectedId].disabled) ||
                            (importingDocuments && importingDocuments.length > 0)
                        }
                        onClick={onDeleteClicked}
                    >
                        Delete
                    </Button>
                </Tooltip>
                {importingDocuments && importingDocuments.length > 0 && <Spinner size="tiny" />}
                {/* Hardcode vector database as we don't support switching vector store dynamically now. */}
                <div className={classes.vectorDatabase}>
                    <Label size="large">Vector Database:</Label>
                    <RadioGroup
                        defaultValue={serviceInfo.memoryStore.selectedType}
                        layout="horizontal"
                        disabled={conversations[selectedId].disabled}
                    >
                        {serviceInfo.memoryStore.types.map((storeType) => {
                            return (
                                <Radio
                                    key={storeType}
                                    value={storeType}
                                    label={storeType}
                                    disabled={storeType !== serviceInfo.memoryStore.selectedType}
                                />
                            );
                        })}
                    </RadioGroup>
                </div>
            </div>
            {useGrid()}
        </TabView>
    );

    function useGrid() {
        const gridRef = useRef(null);
        const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
        const [rowData, setRowData] = useState<ChatMemorySource[]>([]);
        const columnDefs: ColDef[] = [
            { headerName: 'Filename', field: 'name' },
            {
                headerName: 'Size',
                field: 'size',
                valueGetter: (params) => humanFileSize((params.data as { size: number }).size),
            },
            { headerName: 'Updated By', field: 'sharedBy' },
            {
                headerName: 'Last Updated',
                field: 'createdOn',
                valueGetter: (params) => (params.data as { createdOn: Date }).createdOn.toDateString(),
            },
            {
                headerName: 'Access',
                field: 'chatId',
                valueGetter: (params) => getAccessString((params.data as { chatId: string }).chatId),
            },
            { headerName: 'Status', field: 'sourceType' },
            { headerName: 'Query', field: 'isQueryable', width: 40 },
            { headerName: 'Delete', field: 'isQueryable', width: 40 },
        ];

        const defaultColDef = useMemo(() => {
            return {
                editable: false,
                flex: 1,
                width: 200,
                minWidth: 200,
                filter: true,
            };
        }, []);

        return (
            <div style={gridStyle} className={'ag-theme-quartz-dark'}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    suppressBrowserResizeObserver={true}
                    onGridReady={function (params) {
                        const gridApi = params.api;
                        gridApi.sizeColumnsToFit();

                        gridApi.showLoadingOverlay();

                        if (!conversations[selectedId].disabled) {
                            const importingResources = importingDocuments
                                ? importingDocuments.map((document, index) => {
                                      return {
                                          id: `in-progress-${index}`,
                                          chatId: selectedId,
                                          sourceType: 'N/A',
                                          name: document,
                                          sharedBy: 'N/A',
                                          createdOn: 0,
                                          size: 0,
                                      } as ChatMemorySource;
                                  })
                                : [];
                            setResources(importingResources);

                            void chat.getChatMemorySources(selectedId).then((sources) => {
                                if (sources.length + importingResources.length == 0) {
                                    gridApi.showNoRowsOverlay();
                                } else setRowData([...importingResources, ...sources]);
                            });
                        }
                    }}
                />
            </div>
        );
    }
};

function getAccessString(chatId: string) {
    return chatId === EmptyGuid ? 'Global' : 'This chat';
}

export function getFileIconByFileExtension(fileName: string, props: FluentIconsProps = {}) {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.') + 1);
    if (extension === 'pdf') {
        return <DocumentPdfRegular {...props} />;
    }
    return <DocumentTextRegular {...props} />;
}

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
function humanFileSize(bytes: number, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return bytes.toFixed(dp) + ' ' + units[u];
}
