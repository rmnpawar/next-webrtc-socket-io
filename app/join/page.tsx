"use client";

import { useCallback, useContext, useState } from "react";
import { useSocketContext } from "@/contexts/useSocket";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page() {
    const [userName, setUserName] = useState("");
    const { socket } = useSocketContext();
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);

            return params.toString();
        },
        [searchParams]
    );

    const handleUserName = (event: any) => {
        setUserName(event.target.value);
    };

    const handleJoin = () => {
        if (userName !== "" && socket.connected) {
            socket.emit("online", { userName });
            router.push(`/chat/${socket.id}?${createQueryString("hostName", userName)}`);
        } else {
            console.log("something went wrong");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-300 to-gray-400">
            <div className="bg-white/30 backdrop-blur-md p-8 rounded-lg shadow-lg w-96">
                <div className="flex justify-center font-sans">
                    <h1 className="text-xl font-semibold mb-4 text-gray-800">
                        Display Name
                    </h1>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        name="userName"
                        value={userName}
                        onChange={handleUserName}
                        className="mt-1 p-2 w-full rounded-md border-gray-300 outline-none focus:shadow-md bg-white/30"
                        required
                    />
                </div>

                <div className="flex justify-center">
                    <button
                        className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        onClick={handleJoin}
                    >
                        Join
                    </button>
                </div>
            </div>
        </div>
    );
}
