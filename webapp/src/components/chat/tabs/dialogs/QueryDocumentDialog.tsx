import { Button } from '@fluentui/react-button';
import { Tooltip, makeStyles } from '@fluentui/react-components';
import {
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
} from '@fluentui/react-dialog';
import { Search20Regular } from '@fluentui/react-icons';
import { AlertType } from '../../../../libs/models/AlertType';
import { useAppDispatch } from '../../../../redux/app/hooks';
import { addAlert } from '../../../../redux/features/app/appSlice';

const useClasses = makeStyles({
    root: {
        width: '450px',
    },
    actions: {
        paddingTop: '10%',
    },
});

interface IDeleteDocumentProps {
    chatId: string;
    documentId: string;
    documentName: string;
}

export const QueryDocumentDialog: React.FC<IDeleteDocumentProps> = ({ chatId, documentId, documentName }) => {
    const classes = useClasses();
    const dispatch = useAppDispatch();

    const onQueryDocument = () => {
        console.log(chatId);
        console.log(documentId);

        dispatch(
            addAlert({
                message: `Querying document {${documentName}}`,
                type: AlertType.Info,
            }),
        );

        // const removal: DocumentRemoval = {
        //     id: documentId,
        //     fileName: documentName,
        //     chatId: chatId,
        // };

        // const removals: DocumentRemoval[] = [removal];

        // await documentImportService
        //     .deleteDocumentAsync(removals, await AuthHelper.getSKaaSAccessToken(instance, inProgress))
        //     .catch((e: any) => {
        //         const errorDetails = (e as Error).message.includes('Failed to delete resources for chat id')
        //             ? "Some or all resources associated with this chat couldn't be deleted. Please try again."
        //             : `Details: ${(e as Error).message}`;
        //         dispatch(
        //             addAlert({
        //                 message: `Unable to delete document {${documentName}}. ${errorDetails}`,
        //                 type: AlertType.Error,
        //             }),
        //         );
        //     });
    };

    return (
        <Dialog modalType="alert">
            <DialogTrigger>
                <Tooltip content={'Delete chat session'} relationship="label">
                    <Button icon={<Search20Regular />} appearance="transparent" aria-label="Edit" />
                </Tooltip>
            </DialogTrigger>
            <DialogSurface className={classes.root}>
                <DialogBody>
                    <DialogTitle>Are you sure you want to query document: {documentName}?</DialogTitle>
                    <DialogContent>
                        This action will attempt to query the document by any registered handler: {documentName}
                        <p />
                    </DialogContent>
                    <DialogActions className={classes.actions}>
                        <DialogTrigger action="close" disableButtonEnhancement>
                            <Button appearance="secondary">Cancel</Button>
                        </DialogTrigger>
                        <DialogTrigger action="close" disableButtonEnhancement>
                            <Button appearance="primary" onClick={onQueryDocument}>
                                Query
                            </Button>
                        </DialogTrigger>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};
