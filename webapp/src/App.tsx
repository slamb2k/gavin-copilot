// Copyright (c) Microsoft. All rights reserved.

import { AuthenticatedTemplate, UnauthenticatedTemplate, useIsAuthenticated, useMsal } from '@azure/msal-react';
import { FluentProvider, Image, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import 'react-tooltip/dist/react-tooltip.css';

import * as React from 'react';
import { useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import { LogoSection } from './components/header/LogoSection';
import { UserSettingsMenu } from './components/header/UserSettingsMenu';
import { PluginGallery } from './components/open-api-plugins/PluginGallery';
import { BackendProbe, ChatView, Error, Loading, Login } from './components/views';
import { AuthHelper } from './libs/auth/AuthHelper';
import { useChat, useFile } from './libs/hooks';
import { useAppDispatch, useAppSelector } from './redux/app/hooks';
import { RootState } from './redux/app/store';
import { FeatureKeys } from './redux/features/app/AppState';
import { setActiveUserInfo, setServiceInfo } from './redux/features/app/appSlice';
import { semanticKernelDarkTheme, semanticKernelLightTheme } from './styles';

import headerBackground from './assets/gavin-header.png';
import msOpenAILogo from './assets/ms-openai-logo.png';

export const useClasses = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        ...shorthands.overflow('hidden'),
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundImage: `url(${headerBackground})`,
        backgroundRepeat: 'no-repeat',
        height: '14vh',
        backgroundSize: 'cover',
        backgroundColor: 'black',
    },
    headerLeft: {
        display: 'flex',
        flexShrink: '0',
    },
    headerRight: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingRight: '30px',
        paddingTop: '20px',
        paddingBottom: '20px',
        ...shorthands.gap(tokens.spacingVerticalXL),
    },
    headerCustomerLogo: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        objectFit: 'scale-down',
        height: '30%',
    },
    headerToolbar: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: 'auto',
        paddingRight: '0px',
    },
    headerToolbarItem: {
        opacity: '0.7',
        '&:hover': {
            cursor: 'pointer',
            opacity: '1.0',
        },
    },
});

enum AppState {
    ProbeForBackend,
    SettingUserInfo,
    ErrorLoadingChats,
    ErrorLoadingUserInfo,
    LoadingChats,
    Chat,
    SigningOut,
}

const App = () => {
    const classes = useClasses();

    const [appState, setAppState] = React.useState(AppState.ProbeForBackend);
    const dispatch = useAppDispatch();

    const { instance, inProgress } = useMsal();
    const { features, isMaintenance } = useAppSelector((state: RootState) => state.app);
    const isAuthenticated = useIsAuthenticated();

    const chat = useChat();
    const file = useFile();

    useEffect(() => {
        if (isMaintenance && appState !== AppState.ProbeForBackend) {
            setAppState(AppState.ProbeForBackend);
            return;
        }

        if (isAuthenticated && appState === AppState.SettingUserInfo) {
            const account = instance.getActiveAccount();
            if (!account) {
                setAppState(AppState.ErrorLoadingUserInfo);
            } else {
                dispatch(
                    setActiveUserInfo({
                        id: `${account.localAccountId}.${account.tenantId}`,
                        email: account.username, // username is the email address
                        username: account.name ?? account.username,
                    }),
                );

                // Privacy disclaimer for internal Microsoft users
                // if (account.username.split('@')[1] === 'microsoft.com') {
                //     dispatch(
                //         addAlert({
                //             message:
                //                 'By using {process.env.REACT_APP_TITLE}, you agree to protect sensitive data, not store it in chat, and allow chat history collection for service improvements. This tool is for internal use only.',
                //             type: AlertType.Info,
                //         }),
                //     );
                // }

                setAppState(AppState.LoadingChats);
            }
        }

        if ((isAuthenticated || !AuthHelper.isAuthAAD()) && appState === AppState.LoadingChats) {
            void Promise.all([
                // Load all chats from memory
                chat
                    .loadChats()
                    .then(() => {
                        setAppState(AppState.Chat);
                    })
                    .catch(() => {
                        setAppState(AppState.ErrorLoadingChats);
                    }),

                // Check if content safety is enabled
                file.getContentSafetyStatus(),

                // Load service information
                chat.getServiceInfo().then((serviceInfo) => {
                    if (serviceInfo) {
                        dispatch(setServiceInfo(serviceInfo));
                    }
                }),
            ]);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instance, inProgress, isAuthenticated, appState, isMaintenance]);

    const content = <Chat classes={classes} appState={appState} setAppState={setAppState} />;
    return (
        <FluentProvider
            className="app-container"
            theme={features[FeatureKeys.DarkMode].enabled ? semanticKernelDarkTheme : semanticKernelLightTheme}
        >
            {AuthHelper.isAuthAAD() ? (
                <>
                    <UnauthenticatedTemplate>
                        <div className={classes.container}>
                            <div className={classes.header}>
                                <div className={classes.headerLeft}>
                                    <LogoSection />
                                </div>
                                <div className={classes.headerRight}>
                                    <div className={classes.headerCustomerLogo}>
                                        <Image src={msOpenAILogo} />
                                    </div>
                                    <div className={classes.headerToolbar}>
                                        <div className={classes.headerToolbarItem}>
                                            <PluginGallery />
                                        </div>
                                        <div className={classes.headerToolbarItem}>
                                            <UserSettingsMenu
                                                setLoadingState={() => {
                                                    setAppState(AppState.SigningOut);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {appState === AppState.SigningOut && <Loading text="Signing you out..." />}
                            {appState !== AppState.SigningOut && <Login />}
                        </div>
                    </UnauthenticatedTemplate>
                    <AuthenticatedTemplate>{content}</AuthenticatedTemplate>
                </>
            ) : (
                content
            )}
        </FluentProvider>
    );
};

const Chat = ({
    classes,
    appState,
    setAppState,
}: {
    classes: ReturnType<typeof useClasses>;
    appState: AppState;
    setAppState: (state: AppState) => void;
}) => {
    const onBackendFound = React.useCallback(() => {
        setAppState(
            AuthHelper.isAuthAAD()
                ? // if AAD is enabled, we need to set the active account before loading chats
                  AppState.SettingUserInfo
                : // otherwise, we can load chats immediately
                  AppState.LoadingChats,
        );
    }, [setAppState]);
    return (
        <div className={classes.container}>
            <div className={classes.header} data-tooltip-id="headerTooltip" data-tooltip-place="top">
                <Tooltip id="headerTooltip" place="left-start" style={{ width: '300px' }}>
                    <div>
                        <h3>Midjourney Prompt</h3>
                        <p>
                            A photograph of a lonely cyborg wandering around a carpark late at night, trying to remember
                            where he parked his car. Ensure the main subject of the image is on the left side of the
                            shot and is not too far away. --ar 16:9 --v 5.2 --style raw
                        </p>
                    </div>
                </Tooltip>
                <div className={classes.headerLeft}>
                    <LogoSection />
                </div>
                {appState > AppState.SettingUserInfo && (
                    <div className={classes.headerRight}>
                        <div className={classes.headerCustomerLogo}>
                            <Image src={msOpenAILogo} />
                        </div>
                        <div className={classes.headerToolbar}>
                            <div className={classes.headerToolbarItem}>
                                <PluginGallery />
                            </div>
                            <div className={classes.headerToolbarItem}>
                                <UserSettingsMenu
                                    setLoadingState={() => {
                                        setAppState(AppState.SigningOut);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {appState === AppState.ProbeForBackend && <BackendProbe onBackendFound={onBackendFound} />}
            {appState === AppState.SettingUserInfo && (
                <Loading text={'Hang tight while we fetch your information...'} />
            )}
            {appState === AppState.ErrorLoadingUserInfo && (
                <Error text={'Unable to load user info. Please try signing out and signing back in.'} />
            )}
            {appState === AppState.ErrorLoadingChats && (
                <Error text={'Unable to load chats. Please try refreshing the page.'} />
            )}
            {appState === AppState.LoadingChats && <Loading text="Loading chats..." />}
            {appState === AppState.Chat && <ChatView />}
        </div>
    );
};

export default App;
