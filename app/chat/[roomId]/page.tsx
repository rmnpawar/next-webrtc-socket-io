"use client";

import { useSocketContext } from "@/contexts/useSocket";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ChatPage from "./ChatPage";

type Users = {
    userName: string;
    socketId: string;
};

export type Message = {
    fromRoomId: string;
    toRoomId: string;
    userName: string;
    message: string;
    time: string;
};

type MessageStore = {
    [socketid: string]: Message[];
};

export default function Page() {
    const { socket } = useSocketContext();
    const [users, setOnlineUsers] = useState<Users[]>([]);
    const [messageStore, setMessageStore] = useState<MessageStore>({});
    const searchParams = useSearchParams();
    const [userName, setUserName] = useState("")
    const [roomId, setRoomId] = useState(""); // room id for recepient
    const router = useRouter();

    const initialiseChatStore = (socketId: string) => {
        setMessageStore((pre) => {
            const tempStore = { ...pre };
            tempStore[socketId] = [];
            return tempStore;
        });
    };

    useEffect(() => {
        if (socket?.connected) {
            socket.on("online_users", (onlineUsers: Users[]) => {
                setOnlineUsers(onlineUsers);

                onlineUsers.forEach(({ socketId }) => {
                    initialiseChatStore(socketId);
                });

                console.log(onlineUsers);
            });
            socket.on("new_user", (data) => {
                setOnlineUsers((pre) => ([ ...pre, data ]));
                initialiseChatStore(data.socketId);
            });

            socket.on("receive_msg", (data: Message) => {
                setMessageStore((pre) => {
                    const tempStore = {...pre};
                    tempStore[data.fromRoomId].push(data);
                    return tempStore;
                })
                console.log(data);
            });

            socket.on("call_request", (joinRoom) => {
                router.push(`/room/${joinRoom}`);
            })
            socket.emit("getUsers");
        }

        return () => {
            socket.off("online_users");
            socket.off("receive_msg");
        };
    }, []);

    return (
        <div className="flex min-h-screen bg-opacity-60 bg-gradient-to-t from-slate-300 via-neutral-300 to-gray-500 backdrop-blur-lg">
            <div className="w-1/4 bg-gray-300 bg-opacity-70 p-6 text-gray-800 backdrop-blur-lg">
                <h1 className="text-2xl font-semibold">Chats</h1>
                <ul className="mt-4 shadow-xl">
                    {users.map((user) => (
                        <li
                            key={user.socketId}
                            className="box my-2 rounded border-2 border-solid bg-gray-200 px-4 py-2 shadow-md hover:bg-red-100"
                            onClick={() => {
                                setRoomId(user.socketId);
                                setUserName(user.userName);
                            }}
                        >
                            <span className="font-semibold">
                                {user.userName}
                            </span>
                            <p className="text-sm text-gray-600">
                                {messageStore[user.socketId]?.at(-1)?.message}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
            {roomId !== "" && (
                <ChatPage
                    socket={socket}
                    roomId={roomId}
                    userName={userName}
                    chat={messageStore[roomId]}
                />
            )}
        </div>
    );
}
