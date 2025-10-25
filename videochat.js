const SIGNALING_SERVER = "https://let-nuog.onrender.com"; // o'zingizning Node.js server URL

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const leaveBtn = document.getElementById("leaveBtn");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const messagesEl = document.getElementById("messages");

let socket, pc, localStream, roomId;

// Local video olish
async function startLocalStream() {
    localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    localVideo.srcObject = localStream;
}

// PeerConnection yaratish
function createPeerConnection() {
    pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.ontrack = e => remoteVideo.srcObject = e.streams[0];
    pc.onicecandidate = e => { if(e.candidate) socket.emit("ice-candidate", { candidate:e.candidate }); };
}

// Xonaga kirish
joinBtn.onclick = async () => {
    roomId = roomInput.value.trim();
    if(!roomId) return alert("Xona nomini kiriting!");
    await startLocalStream();
    createPeerConnection();
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

    socket = io(SIGNALING_SERVER, { transports:["websocket"] });
    socket.emit("join-room", roomId);

    socket.on("user-joined", async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { offer });
    });

    socket.on("offer", async ({ offer }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { answer });
    });

    socket.on("answer", async ({ answer }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async ({ candidate }) => {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch(e){ console.warn(e); }
    });

    socket.on("chat-message", ({ from, text }) => {
        const p = document.createElement("div");
        p.textContent = `${from===socket.id?"Siz":"U"}: ${text}`;
        messagesEl.appendChild(p);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    socket.on("user-left", () => {
        remoteVideo.srcObject = null;
        if(pc){ pc.close(); pc=null; }
    });

    joinBtn.disabled = true; leaveBtn.disabled = false;
};

// Chiqish
leaveBtn.onclick = () => {
    if(socket) socket.disconnect();
    if(pc){ pc.close(); pc=null; }
    if(localStream){ localStream.getTracks().forEach(t=>t.stop()); localVideo.srcObject=null; }
    joinBtn.disabled=false; leaveBtn.disabled=true;
};

// Chat yuborish
sendBtn.onclick = () => {
    const text = chatInput.value.trim();
    if(!text) return;
    socket.emit("chat-message", text);
    chatInput.value="";
};