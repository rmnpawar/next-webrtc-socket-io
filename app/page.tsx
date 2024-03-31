"use client";
import styles from "./page.module.css";
import { Socket, io } from "socket.io-client";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import ChatPage from "./chat/[roomId]/ChatPage";
import { useSocketContext } from "@/contexts/useSocket";

export default function Home() {
    const [showChat, setShowChat] = useState(false);
    const [userName, setUserName] = useState("");
    const [showSpinner, setShowSpinner] = useState(false);
    const [roomId, setRoomId] = useState("");
    const {socket} = useSocketContext();

    // var socket: any;
    // socket = io("http://localhost:3001");

    useEffect(() => {
        
        const joinedRoom = () => {
            setShowChat(true);
            setShowSpinner(false);
        }
        socket.on("joined", joinedRoom);
        socket.on("created", joinedRoom);

        // return () => {
        //     socket.off("joined");
        //     socket.off("created");
        // }
    })

    const handleJoin = () => {
        if (userName !== "" && roomId !== "") {
            socket.emit("join", {roomName: roomId, userName: userName});
            socket.emit("online", {roomName: roomId, userName: userName});
            setShowSpinner(true);
        } else {
            alert("Please fill in Username and Room Id");
        }
    };
    // socket.on("joined", () => {
    //     console.log("Join Successful")
    //     setShowSpinner(false);
    //     setShowChat(true);
    // });

    return (
        <div>
            <div
                className={styles.main_div}
                style={{ display: showChat ? "none" : "" }}
            >
                <input
                    className={styles.main_input}
                    type="text"
                    placeholder="UserName"
                    onChange={(e) => setUserName(e.target.value)}
                    disabled={showSpinner}
                />
                <input
                    className={styles.main_input}
                    type="text"
                    placeholder="room id"
                    onChange={(e) => setRoomId(e.target.value)}
                    disabled={showSpinner}
                />
                <button
                    className={styles.main_button}
                    onClick={() => handleJoin()}
                >
                    {!showSpinner ? (
                        "Join"
                    ) : (
                        <div className={styles.loading_spinner}></div>
                    )}
                </button>
            </div>
            <div style={{ display: !showChat ? "none" : "" }}>
                <ChatPage socket={socket} roomId={roomId} username={userName} />
            </div>
        </div>
    );
}
