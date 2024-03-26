import { useEffect, useRef, useState } from 'react'
import Peer from 'peerjs' // version 1.3.2

function Webcall() {
    // State variables for storing peer ID and remote peer ID
    const [peerId, setPeerId] = useState('')
    const [remotePeerIdValue, setRemotePeerIdValue] = useState('')

    // Refs for accessing video elements
    const currentUserVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)

    // Ref for storing the Peer instance
    const peerInstance = useRef(null)

    // Ref for storing the current call
    const currentCall = useRef(null)

    // Ref for storing the local media stream
    const localStream = useRef(null)

    useEffect(() => {
        // Create a new instance of Peer
        const peer = new Peer()

        /* 
            Emitted when a connection to the PeerServer is established.
            You may use the peer before this is emitted, but messages to the server will be queued.
            id is the brokering ID of the peer (which was either provided in the constructor or assigned by the server).
        */
        peer.on('open', (id) => {
            console.log('[On open]:', id)
            setPeerId(id)
        })

        /* 
            Emitted when a new data connection is established from a remote peer.
        */
        peer.on('connection', (dataConnection) => {
            console.log('[On connection]:', dataConnection)
        })

        /* 
            Emitted when a remote peer attempts to call you.
            The emitted mediaConnection is not yet active; you must first answer the call (mediaConnection.answer([stream]);).
            Then, you can listen for the stream event.
        */
        peer.on('call', (mediaConnection) => {
            console.log('[On call]:', mediaConnection)

            let getUserMedia = navigator?.getUserMedia || navigator?.webkitGetUserMedia || navigator?.mozGetUserMedia
            getUserMedia(
                { video: mediaConnection?.metadata?.video, audio: true }, // Determine whether it's an audio or video call
                (mediaStream) => {
                    // Display the local media stream
                    currentUserVideoRef.current.srcObject = mediaStream
                    currentUserVideoRef?.current?.play()

                    // Answer the call and display the remote stream
                    mediaConnection?.answer(mediaStream)

                    mediaConnection.on('stream', function (remoteStream) {
                        console.log(
                            '[Call on stream]:',
                            remoteStream,
                            remoteVideoRef.current,
                            remoteVideoRef.current.srcObject
                        )
                       
                        remoteVideoRef.current.srcObject = remoteStream
                        remoteVideoRef?.current?.play()
                    })

                    // Emitted when either you or the remote peer closes the media connection.
                    mediaConnection.on('close', () => {
                        console.log('[Call on close]')
                        hangUp() // Terminate call on callee's side as well
                    })

                    // Errors on the media connection
                    mediaConnection.on('error', (error) => {
                        console.log('[Call on error]:', error)
                        hangUp() // Terminate call on callee's side as well
                    })

                    // Store the local media stream
                    localStream.current = mediaStream
                },
                (error) => {
                    console.log('[Failed to get local stream]: ', error)
                }
            )
            // Store the current call
            currentCall.current = mediaConnection
        })

        /* 
            Emitted when the peer is destroyed and can no longer accept or create any new connections. At this time, the peer's connections will all be closed.
        */
        peer.on('close', () => {
            console.log('[On close]')
            // Perform cleanup or additional logic for hang-up or disconnect here
            hangUp()
        })

        /* 
            Emitted when the peer is disconnected from the signalling server, either manually or because the connection to the signalling server was lost.
            When a peer is disconnected, its existing connections will stay alive, but the peer cannot accept or create any new connections.
            You can reconnect to the server by calling peer.reconnect().
        */
        peer.on('disconnected', () => {
            console.log('[On disconnected]: Reconnecting...')
            peer.reconnect()
        })

        /* 
            Errors on the peer are almost always fatal and will destroy the peer. Errors from the underlying socket and PeerConnections are forwarded here.
        */
        peer.on('error', (error) => {
            console.log('[On error]:', error)
            // Perform cleanup or additional logic for hang-up or disconnect here
            hangUp()
        })

        // Store the Peer instance
        peerInstance.current = peer
    }, [])

    // Function to initiate an audio call
    const audioCall = (remotePeerId) => {
        let getUserMedia = navigator?.getUserMedia || navigator?.webkitGetUserMedia || navigator?.mozGetUserMedia

        getUserMedia(
            { video: false, audio: true },
            (mediaStream) => {
                // Display the local media stream
                currentUserVideoRef.current.srcObject = mediaStream
                currentUserVideoRef?.current?.play()

                // Initiate the call and display the remote stream
                const call = peerInstance?.current?.call(remotePeerId, mediaStream, { metadata: { video: false } })
                call.on('stream', (remoteStream) => {
                    console.log('remoteStream', remoteStream)
                    
                    remoteVideoRef.current.srcObject = remoteStream
                    remoteVideoRef?.current?.play()
                    
                })

                // Store the current call
                currentCall.current = call

                // Store the local media stream
                localStream.current = mediaStream
            },
            (error) => {
                console.log('[Failed to get local stream]: ', error)
            }
        )
    }

    // Function to initiate a video call
    const videoCall = (remotePeerId) => {
        let getUserMedia = navigator?.getUserMedia || navigator?.webkitGetUserMedia || navigator?.mozGetUserMedia

        getUserMedia(
            { video: true, audio: true },
            (mediaStream) => {
                // Display the local media stream
                currentUserVideoRef.current.srcObject = mediaStream
                currentUserVideoRef?.current?.play()

                // Initiate the call and display the remote stream
                const call = peerInstance?.current?.call(remotePeerId, mediaStream, { metadata: { video: true } })
                call.on('stream', (remoteStream) => {
                    console.log('remoteStream', remoteStream)
                    
                    remoteVideoRef.current.srcObject = remoteStream
                    remoteVideoRef?.current?.play()
                    
                })

                // Store the current call
                currentCall.current = call

                // Store the local media stream
                localStream.current = mediaStream
            },
            (error) => {
                console.log('[Failed to get local stream]: ', error)
            }
        )
    }

    // Function to hang up the call
    const hangUp = () => {
        // Turn of video
        if (currentUserVideoRef?.current) currentUserVideoRef.current.srcObject = null
        if (remoteVideoRef?.current) remoteVideoRef.current.srcObject = null

        // Stop all tracks in the local media stream
        if (localStream?.current) {
            localStream?.current?.getTracks()?.forEach((track) => track?.stop())
            localStream.current = null
        }

        if (currentCall?.current) currentCall.current = null

        if (peerInstance?.current) peerInstance.current = null

        // Close the local call
        if (currentCall?.current) {
            currentCall?.current?.close()
        }

        if (peerInstance?.current) {
            // Close the connection to the server, leaving all existing data and media connections intact. peer.disconnected will be set to true and the disconnected event will fire.
            peerInstance?.current?.disconnect()
            // Close the connection to the server and terminate all existing connections. peer.destroyed will be set to true.
            peerInstance?.current?.destroy()
        }
    }

    // Function to toggle mute/unmute audio
    const toggleAudio = () => {
        if (localStream?.current) {
            const audioTracks = localStream?.current?.getAudioTracks()
            audioTracks?.forEach((track) => {
                track.enabled = !track?.enabled // Toggle the enabled state of the audio track
            })
        }
    }

    // Function to toggle enable/disable video
    const toggleVideo = () => {
        if (localStream?.current) {
            const videoTracks = localStream?.current?.getVideoTracks()
            videoTracks?.forEach((track) => {
                track.enabled = !track?.enabled // Toggle the enabled state of the video track
            })
        }
    }

    return (
        <div className="App">
            <div>{peerId}</div>

            <input type="text" value={remotePeerIdValue} onChange={(e) => setRemotePeerIdValue(e?.target?.value)} />

            <div>
                <button onClick={() => audioCall(remotePeerIdValue)}>Audio Call</button>

                <button onClick={() => videoCall(remotePeerIdValue)}>Video Call</button>

                <button onClick={toggleAudio}>Toggle Audio</button>

                <button onClick={toggleVideo}>Toggle Video</button>

                <button onClick={() => hangUp()}>Hang Up</button>
            </div>

            <div>
                <video ref={currentUserVideoRef} style={{ width: '100px' }} playsInline />
            </div>
            <div>
                <video ref={remoteVideoRef} style={{ width: '100px' }} playsInline />
            </div>
        </div>
    )
}

export default Webcall
