/* Neon Drift Online Lobby Add-on
   Adds:
   1. ONLINE PLAY button
   2. Bright 3D lobby room with stairs, upper floors, and empty windows
*/

(function () {
  let lobby3D = null;

  function id(name) {
    return document.getElementById(name);
  }

  function setupOnlineLobbyAddon() {
    addLobbyCSS();
    addOnlineButton();
    addLobbyScreen();

    window.openOnlineLobby = openOnlineLobby;
    window.closeOnlineLobby = closeOnlineLobby;
    window.createOnlineRoom = createOnlineRoom;
    window.joinOnlineRoom = joinOnlineRoom;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupOnlineLobbyAddon);
  } else {
    setupOnlineLobbyAddon();
  }

  function addLobbyCSS() {
    if (id("onlineLobbyCSS")) return;

    const style = document.createElement("style");
    style.id = "onlineLobbyCSS";
    style.textContent = `
      #onlineLobby {
        position: fixed;
        inset: 0;
        z-index: 99999;
        overflow: auto;
        padding: 24px;
        box-sizing: border-box;
        color: white;
        background:
          radial-gradient(circle at 25% 8%, rgba(255,255,255,.95), rgba(153,235,255,.35) 22%, transparent 45%),
          linear-gradient(135deg, #12031f, #250044 48%, #061b35);
      }

      #onlineLobby.hide {
        display: none !important;
      }

      #onlineLobby .lobbyCard {
        width: min(980px, calc(100vw - 48px));
        margin: 0 auto;
        padding: 22px;
        border-radius: 24px;
        text-align: center;
        background: rgba(10, 8, 35, .76);
        border: 2px solid rgba(255,255,255,.28);
        box-shadow: 0 0 35px rgba(0,229,255,.35);
      }

      #onlineLobby h1 {
        margin: 6px 0 10px;
        color: white;
        font-family: "Press Start 2P", system-ui, sans-serif;
        font-size: clamp(20px, 3vw, 34px);
        text-shadow: 0 0 10px #00e5ff, 0 0 22px #ff2d95;
      }

      #onlineLobby .lobbyHint {
        max-width: 800px;
        margin: 0 auto 12px;
        opacity: .88;
        line-height: 1.45;
        font-size: 14px;
      }

      #lobbyCanvas {
        width: 100%;
        max-width: 900px;
        height: min(52vh, 500px);
        min-height: 330px;
        display: block;
        margin: 16px auto;
        border-radius: 18px;
        border: 3px solid rgba(255,255,255,.36);
        background: #dff7ff;
        box-shadow: 0 0 28px rgba(255,255,255,.55), 0 0 38px rgba(0,229,255,.28);
      }

      #onlineLobby .lobbyRow {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }

      #onlineLobby button {
        cursor: pointer;
        border: 0;
        border-radius: 12px;
        padding: 13px 16px;
        color: white;
        font-weight: 900;
        letter-spacing: .5px;
        background: linear-gradient(135deg, #00e5ff, #7b2cff 55%, #ff2d95);
        box-shadow: 0 0 14px rgba(0,229,255,.45);
      }

      #onlineLobby button:hover {
        filter: brightness(1.15);
      }

      #onlineLobby .ghost {
        background: rgba(255,255,255,.14);
        border: 1px solid rgba(255,255,255,.35);
      }

      #roomCodeInput {
        background: rgba(255,255,255,.12);
        border: 2px solid rgba(0,229,255,.55);
        color: white;
        border-radius: 10px;
        padding: 13px 16px;
        font-family: "Press Start 2P", system-ui, sans-serif;
        font-size: 11px;
        outline: none;
        text-align: center;
        max-width: 220px;
        box-sizing: border-box;
      }

      #roomCodeInput::placeholder {
        color: rgba(255,255,255,.55);
      }

      #lobbyStatus {
        min-height: 22px;
        margin-top: 10px;
        font-size: 13px;
        color: #d8f9ff;
      }
    `;
    document.head.appendChild(style);
  }

  function addOnlineButton() {
    if (id("onlineBtn")) return;

    const button = document.createElement("button");
    button.id = "onlineBtn";
    button.textContent = "ONLINE PLAY";
    button.onclick = openOnlineLobby;

    const startButton = id("startBtn");

    if (startButton && startButton.parentNode) {
      startButton.insertAdjacentElement("afterend", button);
      return;
    }

    const menu =
      document.querySelector("#menu .menucard") ||
      document.querySelector("#menu") ||
      document.querySelector(".menucard") ||
      document.body;

    menu.appendChild(button);
  }

  function addLobbyScreen() {
    if (id("onlineLobby")) return;

    const lobby = document.createElement("div");
    lobby.id = "onlineLobby";
    lobby.className = "screen hide";

    lobby.innerHTML = `
      <div class="lobbyCard">
        <h1>ONLINE LOBBY</h1>

        <div class="lobbyHint">
          Create or join a room. This is the bright 3D lobby room screen.
          The real online server connection comes after this part works.
        </div>

        <canvas id="lobbyCanvas" width="900" height="500"></canvas>

        <div class="lobbyRow">
          <button type="button" id="createRoomBtn">CREATE ROOM</button>
          <input id="roomCodeInput" placeholder="ROOM CODE" maxlength="12">
          <button type="button" id="joinRoomBtn">JOIN ROOM</button>
          <button type="button" id="backLobbyBtn" class="ghost">BACK</button>
        </div>

        <div id="lobbyStatus">Waiting in the sunlit lobby...</div>
      </div>
    `;

    document.body.appendChild(lobby);

    id("createRoomBtn").onclick = createOnlineRoom;
    id("joinRoomBtn").onclick = joinOnlineRoom;
    id("backLobbyBtn").onclick = closeOnlineLobby;
  }

  function openOnlineLobby() {
    document.querySelectorAll(".screen").forEach(screen => {
      if (screen.id !== "onlineLobby") {
        screen.classList.add("hide");
      }
    });

    id("onlineLobby").classList.remove("hide");
    buildLobbyRoom();
  }

  function closeOnlineLobby() {
    id("onlineLobby").classList.add("hide");
    stopLobbyRoom();

    const menu = id("menu") || id("mainMenu") || document.querySelector(".screen");
    if (menu) menu.classList.remove("hide");
  }

  function createOnlineRoom() {
    const code = Math.random().toString(36).slice(2, 7).toUpperCase();
    id("roomCodeInput").value = code;
    id("lobbyStatus").textContent = "Room created: " + code + " — server connection comes next.";
  }

  function joinOnlineRoom() {
    const code = id("roomCodeInput").value.trim().toUpperCase();

    if (!code) {
      id("lobbyStatus").textContent = "Type a room code first.";
      return;
    }

    id("lobbyStatus").textContent = "Joining room " + code + " — server connection comes next.";
  }

  function stopLobbyRoom() {
    if (!lobby3D) return;

    if (lobby3D.raf) {
      cancelAnimationFrame(lobby3D.raf);
    }

    try {
      lobby3D.renderer.dispose();
    } catch (e) {}

    lobby3D = null;
  }

  function buildLobbyRoom() {
    const canvas = id("lobbyCanvas");
    if (!canvas) return;

    if (typeof THREE === "undefined") {
      drawFlatLobby(canvas);
      id("lobbyStatus").textContent = "Lobby loaded as flat preview because THREE was not found.";
      return;
    }

    stopLobbyRoom();

    const width = canvas.clientWidth || 900;
    const height = canvas.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true
    });

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xdff7ff, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe8fbff, 900, 2500);

    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 5000);
    camera.position.set(0, 230, 760);
    camera.lookAt(0, 130, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd6c3a0, 1.45));

    const sun = new THREE.DirectionalLight(0xffffff, 1.25);
    sun.position.set(-320, 520, 360);
    scene.add(sun);

    const warmGlow = new THREE.PointLight(0xfff1bf, 1.1, 1100);
    warmGlow.position.set(-260, 260, -220);
    scene.add(warmGlow);

    const floorMat = new THREE.MeshLambertMaterial({ color: 0xf1e4c6 });
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xfff2d2 });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0xcaa66d });
    const railMat = new THREE.MeshLambertMaterial({ color: 0x7f5c3a });
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0xd9fbff,
      transparent: true,
      opacity: 0.58
    });
    const lightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.26
    });

    function box(x, y, z, sx, sy, sz, mat) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    }

    // Room
    box(0, -8, 0, 1000, 16, 900, floorMat);
    box(0, 210, -460, 1000, 420, 22, wallMat);
    box(-510, 210, 0, 22, 420, 900, wallMat);
    box(510, 210, 0, 22, 420, 900, wallMat);

    // Upper floors
    box(-330, 205, -135, 300, 22, 360, floorMat);
    box(330, 205, -135, 300, 22, 360, floorMat);
    box(0, 205, -360, 760, 22, 120, floorMat);

    // Stairs
    for (let i = 0; i < 12; i++) {
      box(-260 + i * 18, 8 + i * 8, 195 - i * 32, 120, 16, 34, trimMat);
      box(260 - i * 18, 8 + i * 8, 195 - i * 32, 120, 16, 34, trimMat);
    }

    // Rails
    box(-330, 245, 48, 310, 35, 16, railMat);
    box(330, 245, 48, 310, 35, 16, railMat);
    box(0, 245, -285, 760, 35, 16, railMat);

    // Empty bright windows
    const windows = [
      [-330, 250, -475],
      [0, 265, -475],
      [330, 250, -475]
    ];

    windows.forEach(p => {
      box(p[0], p[1], p[2], 150, 125, 6, glassMat);
      box(p[0], p[1] + 67, p[2] + 2, 165, 10, 8, trimMat);
      box(p[0], p[1] - 67, p[2] + 2, 165, 10, 8, trimMat);
      box(p[0] - 82, p[1], p[2] + 2, 10, 135, 8, trimMat);
      box(p[0] + 82, p[1], p[2] + 2, 10, 135, 8, trimMat);
    });

    // Sun patches
    const patch1 = box(-220, 2, 75, 230, 3, 120, lightMat);
    patch1.rotation.y = -0.35;

    const patch2 = box(170, 3, -50, 310, 3, 130, lightMat);
    patch2.rotation.y = 0.25;

    // Neon sign and waiting pads
    box(0, 350, -445, 360, 48, 8, new THREE.MeshBasicMaterial({ color: 0x20103d }));
    box(0, 350, -438, 310, 9, 8, neonMat);

    const padMat = new THREE.MeshBasicMaterial({
      color: 0xff2d95,
      transparent: true,
      opacity: 0.65
    });

    const padGeo = new THREE.CylinderGeometry(55, 55, 8, 32);

    [
      [-150, 0, 150],
      [0, 0, 150],
      [150, 0, 150],
      [0, 0, 0]
    ].forEach(p => {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(p[0], 6, p[2]);
      scene.add(pad);
    });

    lobby3D = {
      renderer,
      scene,
      camera,
      t: 0,
      raf: 0
    };

    animateLobby();
  }

  function animateLobby() {
    if (!lobby3D) return;

    lobby3D.t += 0.01;

    const camera = lobby3D.camera;
    camera.position.x = Math.sin(lobby3D.t) * 45;
    camera.position.y = 230 + Math.sin(lobby3D.t * 0.7) * 12;
    camera.lookAt(0, 135, -70);

    lobby3D.renderer.render(lobby3D.scene, lobby3D.camera);
    lobby3D.raf = requestAnimationFrame(animateLobby);
  }

  function drawFlatLobby(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#dff7ff";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#fff2d2";
    ctx.fillRect(80, 60, w - 160, 260);

    ctx.fillStyle = "#f1e4c6";
    ctx.beginPath();
    ctx.moveTo(60, h - 40);
    ctx.lineTo(w - 60, h - 40);
    ctx.lineTo(w - 160, 275);
    ctx.lineTo(160, 275);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d9fbff";
    ctx.fillRect(150, 95, 130, 95);
    ctx.fillRect(385, 85, 130, 105);
    ctx.fillRect(620, 95, 130, 95);

    ctx.strokeStyle = "#caa66d";
    ctx.lineWidth = 8;
    ctx.strokeRect(150, 95, 130, 95);
    ctx.strokeRect(385, 85, 130, 105);
    ctx.strokeRect(620, 95, 130, 95);

    ctx.fillStyle = "#caa66d";
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(190 + i * 22, 325 - i * 12, 115, 12);
      ctx.fillRect(595 - i * 22, 325 - i * 12, 115, 12);
    }

    ctx.fillStyle = "rgba(255,255,255,.45)";
    ctx.fillRect(250, 330, 260, 80);
    ctx.fillRect(515, 335, 230, 75);

    ctx.fillStyle = "#ff2d95";
    ctx.beginPath();
    ctx.arc(360, 390, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#00e5ff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ONLINE LOBBY", w / 2, 50);
  }
})();
