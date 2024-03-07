// import { useEffect, useRef, useState } from 'react'
// import Peer from 'peerjs'

// function Webcall() {
//     const [peerId, setPeerId] = useState('')
//     const [remotePeerIdValue, setRemotePeerIdValue] = useState('')
//     const remoteVideoRef = useRef(null)
//     const currentUserVideoRef = useRef(null)
//     const peerInstance = useRef(null)

//     useEffect(() => {
//         const peer = new Peer()

//         peer.on('open', (id) => {
//             setPeerId(id)
//         })

//         peer.on('call', (call) => {
//             var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

//             getUserMedia({ video: true, audio: true }, (mediaStream) => {
//                 currentUserVideoRef.current.srcObject = mediaStream
//                 currentUserVideoRef.current.play()
//                 call.answer(mediaStream)
//                 call.on('stream', function (remoteStream) {
//                     remoteVideoRef.current.srcObject = remoteStream
//                     remoteVideoRef.current.play()
//                 })
//             })
//         })

//         peerInstance.current = peer
//     }, [])

//     const call = (remotePeerId) => {
//         var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

//         getUserMedia({ video: true, audio: true }, (mediaStream) => {
//             currentUserVideoRef.current.srcObject = mediaStream
//             currentUserVideoRef.current.play()

//             const call = peerInstance.current.call(remotePeerId, mediaStream)

//             call.on('stream', (remoteStream) => {
//                 remoteVideoRef.current.srcObject = remoteStream
//                 remoteVideoRef.current.play()
//             })
//         })
//     }

//     return (
//         <div className="App">
//             <h1>Current user id is {peerId}</h1>
//             <input type="text" value={remotePeerIdValue} onChange={(e) => setRemotePeerIdValue(e.target.value)} />
//             <button onClick={() => call(remotePeerIdValue)}>Call</button>
//             <div>
//                 <video ref={currentUserVideoRef} />
//             </div>
//             <div>
//                 <video ref={remoteVideoRef} />
//             </div>
//         </div>
//     )
// }

// export default Webcall

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

        // Log the Peer instance for debugging purposes
        console.log('peer', peer)

        // Handle 'open' event when successfully connected to PeerServer
        peer.on('open', (id) => {
            console.log('id', id)
            setPeerId(id)
        })

        // Handle 'call' event when receiving a call
        peer.on('call', (call) => {
            console.log('on call')
            var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

            getUserMedia(
                { video: true, audio: true },
                (mediaStream) => {
                    // Display the local media stream
                    currentUserVideoRef.current.srcObject = mediaStream
                    currentUserVideoRef.current.play()
                    // Answer the call and display the remote stream
                    call.answer(mediaStream)
                    call.on('stream', function (remoteStream) {
                        remoteVideoRef.current.srcObject = remoteStream
                        remoteVideoRef.current.play()
                    })
                    // Store the local media stream
                    localStream.current = mediaStream
                },
                (error) => {
                    console.log('Failed to get local stream', error)
                }
            )
            // Store the current call
            currentCall.current = call
        })

        // Store the Peer instance
        peerInstance.current = peer
    }, [])

    // Function to initiate an audio call
    const audioCall = (remotePeerId) => {
        var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

        getUserMedia(
            { video: false, audio: true },
            (mediaStream) => {
                // Display the local media stream
                currentUserVideoRef.current.srcObject = mediaStream
                currentUserVideoRef.current.play()

                // Initiate the call and display the remote stream
                const call = peerInstance.current.call(remotePeerId, mediaStream)

                call.on('stream', (remoteStream) => {
                    console.log('remoteStream', remoteStream)
                    remoteVideoRef.current.srcObject = remoteStream
                    remoteVideoRef.current.play()
                })
                // Store the current call
                currentCall.current = call
                // Store the local media stream
                localStream.current = mediaStream
            },
            (error) => {
                console.log('Failed to get local stream', error)
            }
        )
    }

    // Function to initiate a video call
    const videoCall = (remotePeerId) => {
        var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

        getUserMedia(
            { video: true, audio: true },
            (mediaStream) => {
                // Display the local media stream
                currentUserVideoRef.current.srcObject = mediaStream
                currentUserVideoRef.current.play()

                // Initiate the call and display the remote stream
                const call = peerInstance.current.call(remotePeerId, mediaStream)

                call.on('stream', (remoteStream) => {
                    console.log('remoteStream', remoteStream)
                    remoteVideoRef.current.srcObject = remoteStream
                    remoteVideoRef.current.play()
                })
                // Store the current call
                currentCall.current = call
                // Store the local media stream
                localStream.current = mediaStream
            },
            (error) => {
                console.log('Failed to get local stream', error)
            }
        )
    }

    // Function to hang up the call
    const hangUp = () => {
        if (currentCall.current) {
            currentCall.current.close()
            currentUserVideoRef.current.srcObject = null
            remoteVideoRef.current.srcObject = null
            // Stop all tracks in the local media stream
            localStream.current.getTracks().forEach((track) => track.stop())
        }
    }

    // Function to toggle mute/unmute audio
    const toggleAudio = () => {
        if (localStream.current) {
            const audioTracks = localStream.current.getAudioTracks()
            audioTracks.forEach((track) => {
                track.enabled = !track.enabled // Toggle the enabled state of the audio track
            })
        }
    }

    // Function to toggle enable/disable video
    const toggleVideo = () => {
        if (localStream.current) {
            const videoTracks = localStream.current.getVideoTracks()
            videoTracks.forEach((track) => {
                track.enabled = !track.enabled // Toggle the enabled state of the video track
            })
        }
    }

    return (
        <div className="App">
            <div>{peerId}</div>

            <input type="text" value={remotePeerIdValue} onChange={(e) => setRemotePeerIdValue(e.target.value)} />

            <div>
                <button onClick={() => audioCall(remotePeerIdValue)}>Audio Call</button>

                <button onClick={() => videoCall(remotePeerIdValue)}>Video Call</button>

                <button onClick={toggleAudio}>Toggle Audio</button>

                <button onClick={toggleVideo}>Toggle Video</button>

                <button onClick={() => hangUp(remotePeerIdValue)}>Hang Up</button>
            </div>

            <div>
                <video ref={currentUserVideoRef} style={{ width: '200px' }} />
            </div>
            <div>
                <video ref={remoteVideoRef} style={{ width: '200px' }} />
            </div>
        </div>
    )
}

export default Webcall
