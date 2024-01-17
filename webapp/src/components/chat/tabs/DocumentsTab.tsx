/* eslint-disable @typescript-eslint/no-misused-promises */ // $$$
// Copyright (c) Microsoft. All rights reserved.

import {
    Avatar,
    Button,
    DataGrid,
    DataGridBody,
    DataGridCell,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridRow,
    Label,
    Menu,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    ProgressBar,
    Radio,
    RadioGroup,
    Spinner,
    TableCellLayout,
    TableColumnDefinition,
    Tooltip,
    createTableColumn,
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
import * as React from 'react';
import { useRef } from 'react';
import TimeAgo from 'timeago-react';
import { Constants } from '../../../Constants';
import { useChat, useFile } from '../../../libs/hooks';
import { ChatMemorySource } from '../../../libs/models/ChatMemorySource';
import { useAppSelector } from '../../../redux/app/hooks';
import { RootState } from '../../../redux/app/store';
import { Add20 } from '../../shared/BundledIcons';
import { timestampToDateString } from '../../utils/TextUtils';
import { TabView } from './TabView';

// const EmptyGuid = '00000000-0000-0000-0000-000000000000';

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

// interface TableItem {
//     id: string;
//     chatId: string;
//     name: {
//         label: string;
//         icon: JSX.Element;
//         url?: string;
//     };
//     createdOn: {
//         label: string;
//         timestamp: number;
//     };
//     size: number;
// }

interface FileCell {
    label: string;
    icon: JSX.Element;
}

interface SizeCell {
    label: string;
    size: number;
}

interface UpdatedByCell {
    label: string;
}

interface LastUpdatedCell {
    label: string;
    timestamp: number;
}

interface StatusCell {
    label: string;
    progress: number;
}

interface Item {
    id: string;
    chatId: string;
    file: FileCell;
    size: SizeCell;
    updatedBy: UpdatedByCell;
    lastUpdated: LastUpdatedCell;
    status: StatusCell;
}

export const DocumentsTab: React.FC = () => {
    const classes = useClasses();
    const chat = useChat();
    const fileHandler = useFile();

    const { serviceInfo } = useAppSelector((state: RootState) => state.app);
    const { conversations, selectedId } = useAppSelector((state: RootState) => state.conversations);
    const { importingDocuments } = conversations[selectedId];

    const [resources, setResources] = React.useState<ChatMemorySource[]>([]);
    const localDocumentFileRef = useRef<HTMLInputElement | null>(null);
    const globalDocumentFileRef = useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
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
                setResources([...importingResources, ...sources]);
            });
        }
        // We don't want to have chat as one of the dependencies as it will cause infinite loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importingDocuments, selectedId]);

    // const onDeleteDocument = (chatId: string, documentId: string) => {
    //     void fileHandler.deleteDocument(chatId, documentId);
    // };

    //const handleDelete = async (chatId: string, documentId: string) => {
    //     try {
    //         await fileHandler.deleteDocument(chatId, documentId);
    //         // Update the state immediately after deleting the file
    //         setResources((prevResources) => prevResources.filter((resource) => resource.id !== documentId));
    //     } catch (error) {
    //         console.error('Failed to delete the file:', error);
    //     }
    // };

    // const { columns, rows } = useTable(resources, handleDelete, onDeleteDocument);

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
                            conversations[selectedId].disabled || (importingDocuments && importingDocuments.length > 0)
                        }
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
            {useGrid(resources)}
        </TabView>
    );

    function useGrid(resources: ChatMemorySource[]) {
        const items = resources.map(
            (source) =>
                ({
                    id: source.id,
                    chatId: selectedId,
                    file: { label: source.name, icon: getFileIconByFileExtension(source.name) },
                    size: { label: source.size.toString(), size: source.size },
                    updatedBy: { label: 'System Administrator' },
                    lastUpdated: {
                        label: timestampToDateString(source.createdOn),
                        timestamp: source.createdOn,
                    },
                    status: { label: 'In Progress', progress: 1 },
                }) as Item,
        );

        const columns: Array<TableColumnDefinition<Item>> = [
            createTableColumn<Item>({
                columnId: 'file',
                compare: (a, b) => {
                    return a.file.label.localeCompare(b.file.label);
                },
                renderHeaderCell: () => {
                    return 'File';
                },
                renderCell: (item) => {
                    return (
                        <TableCellLayout truncate media={item.file.icon}>
                            {item.file.label}
                        </TableCellLayout>
                    );
                },
            }),
            createTableColumn<Item>({
                columnId: 'size',
                compare: (a, b) => {
                    return a.size.label.localeCompare(b.size.label);
                },
                renderHeaderCell: () => {
                    return 'Size';
                },
                renderCell: (item) => {
                    return <TableCellLayout>{humanFileSize(item.size.size)}</TableCellLayout>;
                },
            }),
            createTableColumn<Item>({
                columnId: 'updatedBy',
                compare: (a, b) => {
                    return a.updatedBy.label.localeCompare(b.updatedBy.label);
                },
                renderHeaderCell: () => {
                    return 'Updated By';
                },
                renderCell: (item) => {
                    return (
                        <TableCellLayout
                            truncate
                            media={
                                <Avatar
                                    aria-label={item.updatedBy.label}
                                    name={item.updatedBy.label}
                                    // badge={{ status: item.updatedBy.status }}
                                />
                            }
                        >
                            {item.updatedBy.label}
                        </TableCellLayout>
                    );
                },
            }),
            createTableColumn<Item>({
                columnId: 'lastUpdated',
                compare: (a, b) => {
                    return a.lastUpdated.label.localeCompare(b.lastUpdated.label);
                },
                renderHeaderCell: () => {
                    return 'Last updated';
                },

                renderCell: (item) => {
                    return (
                        <TableCellLayout truncate>
                            {<TimeAgo datetime={item.lastUpdated.timestamp} live={false} />}
                        </TableCellLayout>
                    );
                },
            }),
            createTableColumn<Item>({
                columnId: 'status',
                compare: (a, b) => {
                    return a.status.label.localeCompare(b.status.label);
                },
                renderHeaderCell: () => {
                    return 'Status';
                },
                renderCell: (item) => {
                    return (
                        <TableCellLayout truncate>
                            {item.status.progress > 0 && (
                                <ProgressBar max={1} value={item.status.progress} shape="rounded" thickness="large" />
                            )}
                            {item.status.label}
                        </TableCellLayout>
                    );
                },
            }),
        ];

        return (
            <DataGrid
                items={items}
                ref={(el) => {
                    console.log('__Ref', el);
                }}
                columns={columns}
                sortable
                getRowId={(item: Item) => item.file.label}
                selectionMode="multiselect"
                onSelectionChange={(_, data) => {
                    console.log(data);
                }}
                resizableColumns
                columnSizingOptions={{
                    file: {
                        minWidth: 200,
                        defaultWidth: 500,
                        idealWidth: 500,
                    },
                    updatedBy: {
                        defaultWidth: 200,
                        minWidth: 100,
                        idealWidth: 200,
                    },
                    lastUpdated: {
                        defaultWidth: 200,
                        minWidth: 100,
                        idealWidth: 200,
                    },
                }}
                onColumnResize={(event, { columnId, width }) => {
                    if (event instanceof MouseEvent) {
                        console.log(event.offsetX, event.offsetY, columnId, width);
                    }
                }}
            >
                <DataGridHeader>
                    <DataGridRow selectionCell={{ 'aria-label': 'Select all rows' }}>
                        {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
                    </DataGridRow>
                </DataGridHeader>
                <DataGridBody<Item>>
                    {({ item, rowId }) => (
                        <DataGridRow<Item> key={rowId} selectionCell={{ 'aria-label': 'Select row' }}>
                            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                        </DataGridRow>
                    )}
                </DataGridBody>
            </DataGrid>
        );
    }
};

//     const {
//         sort: { getSortDirection, toggleColumnSort, sortColumn },
//     } = useTableFeatures(
//         {
//             columns,
//             items,
//         },
//         [
//             useTableSort({
//                 defaultSortState: { sortColumn: 'createdOn', sortDirection: 'descending' },
//             }),
//         ],
//     );

//     if (sortColumn) {
//         items.sort((a, b) => {
//             const compare = columns.find((column) => column.columnId === sortColumn)?.compare;
//             return compare?.(a, b) ?? 0;
//         });
//     }

//     return { columns, rows: items };
// }

// function getAccessString(chatId: string) {
//     return chatId === EmptyGuid ? 'Global' : 'This chat';
// }

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
