import { createContext, useContext } from "react";

type PeerContextType = {
    peerConnection: RTCPeerConnection
}

export const PeerContext = createContext<PeerContextType | null>(null);

export function PeerContextProvider({ children }: {children: React.ReactNode}) {
    const peerConnection = new RTCPeerConnection();

    return (
        <PeerContext.Provider value={{
            peerConnection
        }}>
            {children}
        </PeerContext.Provider>
    )
}

export function usePeerContext() {
    const context = useContext(PeerContext);

    if (!context) {
        throw new Error("There is something wrong with context");
    }

    return context;
}