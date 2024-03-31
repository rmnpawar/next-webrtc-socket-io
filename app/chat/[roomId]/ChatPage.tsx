"use client";
import React, { useEffect, useState } from "react";
import style from "./chat.module.css";
import { useSocketContext } from "@/contexts/useSocket";
import { Message } from "./page";
import { useRouter, useSearchParams } from "next/navigation";

import { FaArrowUp } from "react-icons/fa";
import { CiVideoOn } from "react-icons/ci";
import Link from "next/link";
import { randomUUID } from "crypto";

interface IMsgDataTypes {
    to: String | number;
    user: String;
    msg: String;
    time: String;
}

const ChatPage = ({ socket, roomId, chat, userName }: any) => {
    const [currentMsg, setCurrentMsg] = useState("");
    const searchParams = useSearchParams();
    const hostName = searchParams.get("hostName") || "";
    const router = useRouter();
    // const [chat, setChat] = useState<IMsgDataTypes[]>([]);
    // const {socket} = useSocketContext();

    const  handleVideoCall = async () => {
        const newRoomId = crypto.randomUUID();
        await socket.emit("video_call", {callee: roomId, joinRoom: newRoomId});
        router.push(`/room/${newRoomId}`);
    };

    const sendData = async () => {
        if (currentMsg !== "") {
            const msgData: Message = {
                fromRoomId: socket.id,
                toRoomId: roomId,
                userName: hostName,
                message: currentMsg,
                time:
                    new Date(Date.now()).getHours() +
                    ":" +
                    new Date(Date.now()).getMinutes(),
            };
            await socket.emit("send_msg", msgData);
            chat.push(msgData);
            setCurrentMsg("");
        }
    };

    return (
        // <div classNameName={style.chat_div}>
        //     <div classNameName={style.chat_border}>
        //         <div style={{ marginBottom: "1rem" }}>
        //             <p>
        //                 Name: <b>{username}</b> and Room Id: <b>{roomId}</b>
        //             </p>
        //         </div>
        //         <div>
        //             {chat.map(({ roomId, user, msg, time }, key) => (
        //                 <div
        //                     key={key}
        //                     classNameName={
        //                         user == username
        //                             ? style.chatProfileRight
        //                             : style.chatProfileLeft
        //                     }
        //                 >
        //                     <span
        //                         classNameName={style.chatProfileSpan}
        //                         style={{
        //                             textAlign:
        //                                 user == username ? "right" : "left",
        //                         }}
        //                     >
        //                         {user.charAt(0)}
        //                     </span>
        //                     <h3
        //                         style={{
        //                             textAlign:
        //                                 user == username ? "right" : "left",
        //                         }}
        //                     >
        //                         {msg}
        //                     </h3>
        //                 </div>
        //             ))}
        //         </div>
        //         <div>
        //             <form onSubmit={(e) => sendData(e)}>
        //                 <input
        //                     classNameName={style.chat_input}
        //                     type="text"
        //                     value={currentMsg}
        //                     placeholder="Type your message.."
        //                     onChange={(e) => setCurrentMsg(e.target.value)}
        //                 />
        //                 <button classNameName={style.chat_button}>Send</button>
        //             </form>
        //         </div>
        //     </div>
        // </div>
        <div className="bg-blur-md flex flex-1 flex-col justify-between bg-white/55 backdrop-blur-lg">
            <div className="mb-4 bg-opacity-0 bg-gradient-to-t from-gray-200 to-gray-300 p-4 shadow-md flex justify-between">
                <h2 className="text-xl font-semibold">{userName}</h2>
                <CiVideoOn
                    size={30}
                    className="mr-20"
                    onClick={handleVideoCall}
                />
            </div>

            <div className="h-96 flex-grow overflow-y-auto p-6">
                {chat?.map(({ userName, message, time }: any) => (
                    <div
                        className={
                            hostName == userName
                                ? `mb-4 flex justify-end`
                                : `mb-4 flex justify-start`
                        }
                    >
                        <div className="rounded-md bg-blue-500 pt-2 px-2 text-white">
                            <p className="leading-none mb-1">{message}</p>
                            <span className="w-full text-gray-600 text-[10px] ">
                                <p className="text-right">{time}</p>
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-2 flex bg-gray-300 p-2 shadow-xl">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={currentMsg}
                    onChange={(e) => {
                        setCurrentMsg(e.target.value);
                    }}
                    className="flex-1 rounded-md bg-transparent px-4 py-2 placeholder-black/70 outline-none transition-all focus:bg-gray-200 focus:shadow-md focus:shadow-red-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                <button
                    className="mx-2 rounded-full bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    onClick={sendData}
                >
                    <FaArrowUp />
                </button>
            </div>
        </div>
    );
};

export default ChatPage;
