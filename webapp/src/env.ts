declare global {
    interface Window {
        env: any
    }
}

// change with your own variables
interface EnvType {
    REACT_APP_TITLE: string
}

export const env: EnvType = { ...(process.env), ...(window.env as EnvType) }
