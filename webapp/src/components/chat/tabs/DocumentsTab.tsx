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
    Search20Regular,
} from '@fluentui/react-icons';
import { ColDef, GridApi, IDetailCellRendererParams } from 'ag-grid-community';
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
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en-AU';

TimeAgo.addDefaultLocale(en);

let gridApi: GridApi<ChatMemorySource>;

// Create formatter (English).
const timeAgo = new TimeAgo('en-AU');

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
    const [rowData, setRowData] = useState<ChatMemorySource[]>([]);

    const { importingDocuments } = conversations[selectedId];

    const localDocumentFileRef = useRef<HTMLInputElement | null>(null);
    const globalDocumentFileRef = useRef<HTMLInputElement | null>(null);

    const handleDelete = async (documentId: string, fileName: string, chatId: string) => {
        try {
            await fileHandler.deleteDocument(documentId, fileName, chatId);
        } catch (error) {
            console.error('Failed to delete the file:', error);
        }
    };

    const onDeleteClicked = async () => {
        gridApi.showLoadingOverlay();
        const selected = gridApi.getSelectedRows();
        const promises = Array.from(selected).map((row) => handleDelete(row.id, row.name, row.chatId));
        await Promise.all(promises);
        refreshGrid();
    };

    function refreshGrid() {
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

            void chat.getChatMemorySources(selectedId).then((sources) => {
                if (sources.length + importingResources.length == 0) {
                    gridApi.showNoRowsOverlay();
                } else setRowData([...importingResources, ...sources]);
            });
        }
    }

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
                        gridApi.showLoadingOverlay();
                        void fileHandler.handleImport(selectedId, localDocumentFileRef, false);
                        refreshGrid();
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
                        gridApi.showLoadingOverlay();
                        void fileHandler.handleImport(selectedId, globalDocumentFileRef, true);
                        refreshGrid();
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
        const columnDefs: ColDef[] = [
            {
                headerName: 'Id',
                hide: true,
                field: 'id',
                minWidth: 400,
            },
            {
                headerName: 'Filename',
                field: 'name',
                minWidth: 400,
                checkboxSelection: true,
                flex: 3,
            },
            {
                headerName: 'Size',
                field: 'size',
                valueGetter: (params) => humanFileSize((params.data as { size: number }).size),
            },
            { headerName: 'Updated By', field: 'sharedBy' },
            {
                headerName: 'Last Updated',
                field: 'createdOn',
                valueGetter: (params) => getTimeAgo((params.data as { createdOn: string }).createdOn),
            },
            {
                headerName: 'Access',
                field: 'chatId',
                valueGetter: (params) => getAccessString((params.data as { chatId: string }).chatId),
            },
            {
                headerName: 'Status',
                valueGetter: () => 'Ready',
            },
            {
                headerName: '',
                field: 'isQueryable',
                maxWidth: 60,
                pinned: 'right',
                resizable: false,
                cellRenderer: () => {
                    return (
                        <Button
                            appearance="subtle"
                            icon={<Search20Regular />}
                            onClick={() => {
                                alert('Not implemented yet');
                            }}
                        />
                    );
                },
            },
            {
                headerName: '',
                maxWidth: 60,
                pinned: 'right',
                resizable: false,
                autoHeight: true,
                cellRenderer: (params: IDetailCellRendererParams) => {
                    return (
                        <Button
                            appearance="subtle"
                            icon={<Delete20Regular />}
                            onClick={async () => {
                                gridApi.showLoadingOverlay();
                                await handleDelete(
                                    (params.data as { id: string }).id,
                                    (params.data as { name: string }).name,
                                    (params.data as { chatid: string }).chatid,
                                );
                                refreshGrid();
                            }}
                        />
                    );
                },
                cellStyle: () => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }),
            },
        ];

        const defaultColDef = useMemo(() => {
            return {
                editable: false,
                flex: 1,
                filter: true,
                cellStyle: () => ({
                    display: 'flex',
                    alignItems: 'center',
                }),
            };
        }, []);

        return (
            <div style={gridStyle} className={'ag-theme-quartz-auto-dark'}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    suppressBrowserResizeObserver={true}
                    rowSelection="multiple"
                    overlayLoadingTemplate={
                        '<div aria-live="polite" aria-atomic="true" style="height:100px; width:100px; background: url(https://ag-grid.com/images/ag-grid-loading-spinner.svg) center / contain no-repeat; margin: 0 auto;" aria-label="loading"></div>'
                    }
                    overlayNoRowsTemplate={
                        '<span aria-live="polite" aria-atomic="true" style="padding: 10px; border: 2px solid #666; background: #55AA77">No documents found.</span>'
                    }
                    onGridReady={function (params: { api: GridApi<ChatMemorySource> }) {
                        gridApi = params.api;
                        refreshGrid();
                    }}
                />
            </div>
        );
    }
};

function getTimeAgo(date: string) {
    //return new Date(date).toDateString();
    return timeAgo.format(new Date(date));
}

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
