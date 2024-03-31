"use client";
import { MutableRefObject, createContext, useContext, useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

type SocketContextType = {
    socket: Socket
}

export const SocketContext = createContext<SocketContextType | null>(null);

export function SocketContextProvider({children}: {children: React.ReactNode}) {
    const SERVERURL = process.env.SERVERURL || "http://localhost:3001";
    // const [status, setStatus] = useState(false);
    // const [socket, setSocket] = useState<Socket>();
    const socketRef = useRef(io(SERVERURL)) as MutableRefObject<Socket>;

    // if (!status) {
    //     setSocket(io(SERVERURL));
    //     setStatus(true);
    //     console.log("socket called");
    // }
   
    return (
        <SocketContext.Provider value={{
            socket: socketRef.current
        }}>
            {children}
        </SocketContext.Provider>
    )
}

export function useSocketContext() {
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error("Something wrong with socket context");
    }
    return context;
}