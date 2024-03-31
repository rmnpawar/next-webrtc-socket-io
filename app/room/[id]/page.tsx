"use client";

import { useRouter } from "next/navigation";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import { useSocketContext } from "@/contexts/useSocket";
// import { socket } from "@/app/hooks/useSocket";

const ICE_SERVERS = {
    iceServers: [
        {
            urls: "stun:openrelay.metered.ca:80",
        },
    ],
};

const Room = ({ params }: { params: { id: string } }) => {
    // useSocket();

    const [micActive, setMicActive] = useState(true);
    const [cameraActive, setCameraActive] = useState(true);

    const router = useRouter();
    const userVideoRef = useRef() as MutableRefObject<HTMLVideoElement>;
    const peerVideoRef = useRef() as MutableRefObject<HTMLVideoElement>;
    const rtcConnectionRef = useRef(
        null
    ) as MutableRefObject<RTCPeerConnection | null>;
    const socketRef = useRef() as MutableRefObject<Socket>;
    const { socket } = useSocketContext();
    // socketRef.current = socket;
    const userStreamRef = useRef() as MutableRefObject<MediaStream>;
    const hostRef = useRef(false);

    const { id: roomName } = params;

    useEffect(() => {
        if (socketRef.current) {
            return;
        }
        socketRef.current = socket;
        // socketRef.current.connect();

        if (roomName !== socketRef.current.id) {
            socketRef.current.emit("join", { roomName });
        } else {
            handleRoomCreated();
        }

        socketRef.current.on("created", handleRoomCreated);

        socketRef.current.on("joined", handleRoomJoined);

        socketRef.current.on("ready", initiateCall);

        socketRef.current.on("leave", onPeerLeave);

        socketRef.current.on("full", () => {
            window.location.href = "/";
        });

        // Events that are webRTC specific
        socketRef.current.on("offer", handleReceiveoffer);
        socketRef.current.on("answer", handleAnswer);
        socketRef.current.on("ice-candidate", handlerNewIceCandidateMsg);

        // return () => {socketRef.current.disconnect()};
    }, []);

    const handleRoomCreated = async () => {
        console.log("room created event");
        hostRef.current = true;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: 500, height: 500 },
        });
        console.log("handleCreated");
        userStreamRef.current = stream;
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.onloadedmetadata = () => {
            userVideoRef.current.play();
        };
        if (roomName == socket.id) {
            initiateCall();
        }
    };

    const handleRoomJoined = () => {
        navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video: { width: 500, height: 500 },
            })
            .then((stream) => {
                userStreamRef.current = stream;
                userVideoRef.current.srcObject = stream;
                userVideoRef.current.onloadedmetadata = () => {
                    userVideoRef.current.play();
                };
                socketRef.current.emit("ready", roomName);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const initiateCall = () => {
        if (hostRef.current) {
            rtcConnectionRef.current = createPeerConnection();
            console.log("initiateCall");
            rtcConnectionRef.current.addTrack(
                userStreamRef.current.getTracks()[0],
                userStreamRef.current
            );
            rtcConnectionRef.current.addTrack(
                userStreamRef.current.getTracks()[1],
                userStreamRef.current
            );
            rtcConnectionRef.current
                .createOffer()
                .then((offer) => {
                    rtcConnectionRef.current?.setLocalDescription(offer);
                    socketRef.current.emit("offer", offer, roomName);
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    };

    const handleReceiveoffer = async (offer: RTCSessionDescriptionInit) => {
        if (!hostRef.current) {
            console.log("offer received")
            rtcConnectionRef.current = createPeerConnection();
            rtcConnectionRef.current.addTrack(
                userStreamRef.current.getTracks()[0],
                userStreamRef.current
            );
            rtcConnectionRef.current.addTrack(
                userStreamRef.current.getTracks()[1],
                userStreamRef.current
            );
            rtcConnectionRef.current.setRemoteDescription(offer);

            rtcConnectionRef.current
                .createAnswer()
                .then((answer) => {
                    rtcConnectionRef.current?.setLocalDescription(answer);
                    socketRef.current.emit("answer", answer, roomName);
                })
                .catch((error) => {
                    console.log(error, "Hello");
                });
        }
    };

    const handleAnswer = (answer: RTCSessionDescriptionInit) => {
        rtcConnectionRef.current
            ?.setRemoteDescription(answer)
            .catch((err) => console.log(err, "Hi"));
    };

    const handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            socketRef.current.emit("ice-candidate", event.candidate, roomName);
        }
    };

    const handlerNewIceCandidateMsg = (incoming: RTCIceCandidate) => {
        const candidate = new RTCIceCandidate(incoming);
        rtcConnectionRef.current
            ?.addIceCandidate(candidate)
            .catch((e) => console.log(e));
    };

    const handleTrackEvent = (event: RTCTrackEvent) => {
        peerVideoRef.current.srcObject = event.streams[0];
    };

    const leaveRoom = () => {
        socketRef.current.emit("leave", roomName);

        if (userVideoRef.current.srcObject) {
            userVideoRef.current.srcObject
                .getTracks()
                .forEach((track) => track.stop());
        }
        if (peerVideoRef.current.srcObject) {
            peerVideoRef.current.srcObject
                .getTracks()
                .forEach((track) => track.stop());
        }

        if (rtcConnectionRef.current) {
            rtcConnectionRef.current.ontrack = null;

            rtcConnectionRef.current.onicecandidate = null;

            rtcConnectionRef.current.close();

            rtcConnectionRef.current = null;
        }

        router.push("/");
    };

    const onPeerLeave = () => {
        hostRef.current = true;
        if (peerVideoRef.current.srcObject) {
            peerVideoRef.current.srcObject

                .getTracks()

                .forEach((track) => track.stop()); // Stops receiving all track of Peer.
        }

        // Safely closes the existing connection established with the peer who left.

        if (rtcConnectionRef.current) {
            rtcConnectionRef.current.ontrack = null;

            rtcConnectionRef.current.onicecandidate = null;

            rtcConnectionRef.current.close();

            rtcConnectionRef.current = null;
        }
    };

    const createPeerConnection = () => {
        const connection = new RTCPeerConnection(ICE_SERVERS);

        connection.onicecandidate = handleICECandidateEvent;
        connection.ontrack = handleTrackEvent;
        return connection;
    };

    const toggleMediaStream = (type: "audio" | "video", state: boolean) => {
        userStreamRef.current.getTracks().forEach((track) => {
            if (track.kind === type) {
                track.enabled = !state;
            }
        });
    };

    const toggleMic = () => {
        toggleMediaStream("audio", micActive);
        setMicActive((prev) => !prev);
    };

    const toggleCamera = () => {
        toggleMediaStream("video", cameraActive);
        setCameraActive((prev) => !prev);
    };

    return (
        <div>
            <video autoPlay ref={userVideoRef} />
            <video autoPlay ref={peerVideoRef} />
            <button onClick={toggleMic} type="button">
                {micActive ? "Mute Mic" : "Unmute Mic"}
            </button>
            <button onClick={leaveRoom} type="button">
                Leave
            </button>
            <button onClick={toggleCamera} type="button">
                {cameraActive ? "Stop Camera" : "Start Camera"}
            </button>
        </div>
    );
};

export default Room;
