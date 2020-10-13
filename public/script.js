const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = {};

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        // Show stream in some video/canvas element.
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  console.log(userId);
  if (peers[userId]) peers[userId].close();
});

peer.on("open", (id) => {
  console.log("peer id >>>", id);
  socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
  console.log("new user >>> ", userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

let text = $("input");

$("html").keydown((e) => {
  if (e.which === 13 && text.val().length !== 0) {
    socket.emit("message", text.val());
    text.val("");
  }
});

socket.on("createMessage", (message) => {
  $("ul").append(`<li class="message"><b>user</b></br>${message}</li>`);
  scrollToBottom();
});

const scrollToBottom = () => {
  let d = $(".main__chatWindow");
  d.scrollTop(d.prop("scrollHeight"));
};

// Mute our video
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
  <i class='fas fa-microphone'></i>
  <span>Mute</span>`;

  document.querySelector(".main__muteButton").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
  <i class='unmute fas fa-microphone-slash'></i>
  <span class='unmute'>Unmute</span>
  `;

  document.querySelector(".main__muteButton").innerHTML = html;
};

// Stop our video
const playStop = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideoButton();
  } else {
    setStopVideoButton();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setStopVideoButton = () => {
  const html = `
  <i class='fas fa-video'></i>
  <span>Stop Video</span>
  `;

  document.querySelector(".main__videoButton").innerHTML = html;
};

const setPlayVideoButton = () => {
  const html = `
  <i class='play fas fa-video-slash'></i>
  <span class='play'>Play Video</span>
  `;

  document.querySelector(".main__videoButton").innerHTML = html;
};
