/* Neon Drift Online Lobby Add-on V3
   Adds a bigger driveable lobby hub:
   - ONLINE PLAY button
   - player name
   - driveable lobby car
   - SPACE interaction system
   - TV preview station
   - music radio station
   - match setup desk
   - garage / custom car spots
   - chat box placeholder
   - friends / achievements placeholder
   - mini-game room placeholder
*/

(function () {
  "use strict";

  const courses = [
    { name: "Neon Bay", color: "#00e5ff", beat: 290, base: 220 },
    { name: "Solar Dunes", color: "#ff9f1c", beat: 340, base: 247 },
    { name: "Glacier", color: "#93c5fd", beat: 420, base: 196 },
    { name: "Midnight City", color: "#ff2d95", beat: 260, base: 277 },
    { name: "Ember Valley", color: "#ff6b00", beat: 310, base: 330 },
    { name: "Aurora Falls", color: "#7dd3fc", beat: 380, base: 185 },
    { name: "Sakura Rush", color: "#ffb4d6", beat: 320, base: 294 },
    { name: "Crystal Caverns", color: "#67e8f9", beat: 360, base: 208 },
    { name: "Skyline Speedway", color: "#c026d3", beat: 260, base: 262 },
    { name: "Twilight Harbor", color: "#a855f7", beat: 390, base: 174 },
    { name: "Canyon Blaze", color: "#f97316", beat: 300, base: 311 },
    { name: "Frostbyte Pass", color: "#38bdf8", beat: 430, base: 165 },
    { name: "Neon Metropolis", color: "#22d3ee", beat: 250, base: 330 },
    { name: "Jungle Circuit", color: "#84cc16", beat: 350, base: 196 },
    { name: "Cobalt Coast", color: "#06b6d4", beat: 330, base: 220 }
  ];

  const state = {
    ready: false,
    scene: null,
    camera: null,
    renderer: null,
    raf: 0,
    keys: {},
    player: null,
    fakePlayers: [],
    garageCars: [],
    stations: [],
    currentStation: null,
    t: 0,
    courseIndex: 0,
    watchIndex: 0,
    radioIndex: -1,
    playerName: localStorage.getItem("neonDriftPlayerName") || "Player",
    carColor: 0xffff00,
    match: {
      laps: 3,
      speed: "Normal",
      items: "Normal"
    },
    audioCtx: null,
    musicTimer: null,
    tvCanvas: null,
    tvTexture: null,
    fishCaught: 0
  };

  function id(name) {
    return document.getElementById(name);
  }

  function setup() {
    if (state.ready) return;
    state.ready = true;

    addCSS();
    addOnlineButton();
    addLobbyScreen();
    bindKeys();
    expose();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }

  function expose() {
    window.openOnlineLobby = openOnlineLobby;
    window.closeOnlineLobby = closeOnlineLobby;
  }

  function addCSS() {
    if (id("onlineLobbyCSS")) return;

    const style = document.createElement("style");
    style.id = "onlineLobbyCSS";
    style.textContent = `
      #onlineLobby {
        position: fixed;
        inset: 0;
        z-index: 99999;
        overflow: hidden;
        color: white;
        background:
          radial-gradient(circle at 20% 8%, rgba(255,255,255,.98), rgba(137,230,255,.28) 22%, transparent 45%),
          linear-gradient(135deg, #10021d, #24003d 48%, #061b35);
      }

      #onlineLobby.hide {
        display: none !important;
      }

      #lobbyWrap {
        position: relative;
        width: 100%;
        height: 100%;
      }

      #lobbyCanvas {
        width: 100%;
        height: 100%;
        display: block;
        background: #dff7ff;
      }

      .lobbyPanel {
        position: absolute;
        background: rgba(8, 7, 28, .76);
        border: 2px solid rgba(0,229,255,.32);
        border-radius: 16px;
        box-shadow: 0 0 22px rgba(0,229,255,.18);
        backdrop-filter: blur(7px);
        padding: 10px;
        box-sizing: border-box;
      }

      #lobbyTop {
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        width: min(900px, calc(100vw - 24px));
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      #lobbyTitle {
        font-family: "Press Start 2P", system-ui, sans-serif;
        font-size: 16px;
        color: white;
        text-shadow: 0 0 9px #00e5ff, 0 0 18px #ff2d95;
        white-space: nowrap;
      }

      #playerNameInput {
        width: 160px;
        border: 2px solid rgba(0,229,255,.6);
        background: rgba(255,255,255,.12);
        color: white;
        border-radius: 10px;
        padding: 9px;
        outline: none;
        text-align: center;
        font-weight: 900;
      }

      .lobbyBtn {
        cursor: pointer;
        border: 0;
        border-radius: 10px;
        padding: 9px 12px;
        color: white;
        font-weight: 900;
        background: linear-gradient(135deg, #00e5ff, #7b2cff 55%, #ff2d95);
        box-shadow: 0 0 12px rgba(0,229,255,.35);
      }

      .lobbyBtn.ghost {
        background: rgba(255,255,255,.14);
        border: 1px solid rgba(255,255,255,.28);
      }

      #lobbyHelp {
        left: 12px;
        top: 88px;
        width: 260px;
        font-size: 12px;
        line-height: 1.45;
      }

      #lobbyHelp b {
        color: #67e8f9;
      }

      #interactHint {
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        width: min(620px, calc(100vw - 24px));
        text-align: center;
        font-weight: 900;
        color: #fff;
        font-size: 14px;
      }

      #chatPanel {
        right: 12px;
        top: 88px;
        width: 300px;
        max-height: 260px;
        font-size: 12px;
      }

      #chatFeed {
        height: 155px;
        overflow: auto;
        background: rgba(0,0,0,.28);
        border-radius: 10px;
        padding: 8px;
        margin-bottom: 8px;
      }

      #chatFeed div {
        margin-bottom: 6px;
      }

      #chatInput {
        width: calc(100% - 72px);
        border: 2px solid rgba(0,229,255,.45);
        background: rgba(255,255,255,.11);
        color: white;
        border-radius: 9px;
        padding: 8px;
        outline: none;
      }

      #matchPanel {
        right: 12px;
        bottom: 88px;
        width: 300px;
        font-size: 12px;
      }

      #matchPanel h3,
      #chatPanel h3,
      #sideInfo h3 {
        margin: 0 0 8px;
        color: #67e8f9;
        font-size: 13px;
      }

      .settingLine {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin: 7px 0;
      }

      .tinyBtn {
        cursor: pointer;
        border: 1px solid rgba(0,229,255,.45);
        background: rgba(0,229,255,.12);
        color: white;
        border-radius: 8px;
        padding: 5px 8px;
        font-size: 11px;
        font-weight: 900;
      }

      #sideInfo {
        left: 12px;
        bottom: 88px;
        width: 285px;
        font-size: 12px;
        line-height: 1.4;
      }

      #roomCodeBox {
        color: #ffe66d;
        font-weight: 900;
      }

      .tag {
        display: inline-block;
        padding: 3px 6px;
        margin: 2px;
        border-radius: 999px;
        background: rgba(255,255,255,.12);
        border: 1px solid rgba(255,255,255,.18);
      }

      @media (max-width: 900px) {
        #lobbyHelp, #chatPanel, #matchPanel, #sideInfo {
          width: 240px;
          font-size: 11px;
        }

        #lobbyTop {
          flex-wrap: wrap;
          justify-content: center;
        }
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
      <div id="lobbyWrap">
        <canvas id="lobbyCanvas"></canvas>

        <div id="lobbyTop" class="lobbyPanel">
          <div id="lobbyTitle">NEON DRIFT ONLINE LOBBY</div>
          <div>
            <input id="playerNameInput" maxlength="14" value="${escapeHTML(state.playerName)}">
            <button class="lobbyBtn" id="saveNameBtn">SAVE NAME</button>
            <button class="lobbyBtn ghost" id="backLobbyBtn">BACK</button>
          </div>
        </div>

        <div id="lobbyHelp" class="lobbyPanel">
          <b>LOBBY CONTROLS</b><br>
          W / ↑ = drive<br>
          S / ↓ = reverse<br>
          A D / ← → = steer<br>
          SPACE = use station<br>
          ENTER = chat<br>
          ESC = leave lobby
        </div>

        <div id="chatPanel" class="lobbyPanel">
          <h3>LOBBY CHAT</h3>
          <div id="chatFeed"></div>
          <input id="chatInput" placeholder="type message">
          <button class="tinyBtn" id="sendChatBtn">SEND</button>
        </div>

        <div id="matchPanel" class="lobbyPanel">
          <h3>MATCH SETUP</h3>
          <div class="settingLine"><span>Course</span><b id="matchCourse">Neon Bay</b></div>
          <div class="settingLine"><span>Laps</span><b id="matchLaps">3</b></div>
          <div class="settingLine"><span>Speed</span><b id="matchSpeed">Normal</b></div>
          <div class="settingLine"><span>Items</span><b id="matchItems">Normal</b></div>
          <button class="tinyBtn" id="courseBtn">CHANGE COURSE</button>
          <button class="tinyBtn" id="lapsBtn">LAPS</button>
          <button class="tinyBtn" id="speedBtn">SPEED</button>
          <button class="tinyBtn" id="itemsBtn">ITEMS</button>
          <button class="tinyBtn" id="startMatchBtn">START MATCH</button>
          <button class="tinyBtn" id="kickBtn">KICK FAKE PLAYER</button>
        </div>

        <div id="sideInfo" class="lobbyPanel">
          <h3>ROOM INFO</h3>
          Room: <span id="roomCodeBox">LOCAL-${Math.floor(1000 + Math.random() * 9000)}</span><br>
          Radio: <span id="radioText">Off</span><br>
          TV: <span id="tvText">Neon Bay / Player</span><br>
          Garage Car: <span id="garageText">Comet</span><br>
          Fish Caught: <span id="fishText">0</span><br>
          <div style="margin-top:8px">
            <span class="tag">Friends placeholder</span>
            <span class="tag">Achievements placeholder</span>
            <span class="tag">Kick placeholder</span>
          </div>
        </div>

        <div id="interactHint" class="lobbyPanel">
          Drive to a glowing station. Press SPACE to use it.
        </div>
      </div>
    `;

    document.body.appendChild(lobby);

    id("saveNameBtn").onclick = savePlayerName;
    id("backLobbyBtn").onclick = closeOnlineLobby;
    id("sendChatBtn").onclick = sendChat;
    id("courseBtn").onclick = nextCourse;
    id("lapsBtn").onclick = cycleLaps;
    id("speedBtn").onclick = cycleSpeed;
    id("itemsBtn").onclick = cycleItems;
    id("startMatchBtn").onclick = startMatchLocal;
    id("kickBtn").onclick = kickFakePlayer;

    addChatMessage("System", "Welcome to the local lobby test.");
    addChatMessage("Nova", "Drive to the TV, radio, garage, match desk, or fish room.");
  }

  function openOnlineLobby() {
    document.querySelectorAll(".screen").forEach(screen => {
      if (screen.id !== "onlineLobby") screen.classList.add("hide");
    });

    id("onlineLobby").classList.remove("hide");
    resizeLobbyCanvas();
    buildLobbyWorld();
    updateHUD();
  }

  function closeOnlineLobby() {
    id("onlineLobby").classList.add("hide");
    stopMusic();
    stopLobbyWorld();

    const menu = id("menu") || id("mainMenu") || document.querySelector(".screen");
    if (menu) menu.classList.remove("hide");
  }

  function resizeLobbyCanvas() {
    const canvas = id("lobbyCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function stopLobbyWorld() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;

    if (state.renderer) {
      try { state.renderer.dispose(); } catch (e) {}
    }

    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.player = null;
    state.fakePlayers = [];
    state.garageCars = [];
    state.stations = [];
    state.currentStation = null;
  }

  function buildLobbyWorld() {
    const canvas = id("lobbyCanvas");
    if (!canvas) return;

    if (typeof THREE === "undefined") {
      drawFlatLobby(canvas);
      id("interactHint").textContent = "THREE was not found, so the lobby is in flat preview mode.";
      return;
    }

    stopLobbyWorld();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });

    renderer.setSize(canvas.width, canvas.height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xdff7ff, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe8fbff, 1000, 2900);

    const camera = new THREE.PerspectiveCamera(
      58,
      canvas.width / canvas.height,
      1,
      6000
    );

    state.renderer = renderer;
    state.scene = scene;
    state.camera = camera;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd6c3a0, 1.45));

    const sun = new THREE.DirectionalLight(0xffffff, 1.25);
    sun.position.set(-420, 620, 420);
    scene.add(sun);

    const warmGlow = new THREE.PointLight(0xfff1bf, 1.1, 1200);
    warmGlow.position.set(-260, 260, -220);
    scene.add(warmGlow);

    createRoomGeometry();
    createStations();
    createGarageCars();
    createFakePlayers();

    state.player = createCar({
      name: state.playerName,
      color: state.carColor,
      x: 0,
      z: 160,
      isPlayer: true
    });

    createTVScreen();
    drawTVTexture();

    animateLobby();
  }

  function createRoomGeometry() {
    const floorMat = matLambert(0xf1e4c6);
    const wallMat = matLambert(0xfff2d2);
    const trimMat = matLambert(0xcaa66d);
    const railMat = matLambert(0x7f5c3a);
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0xd9fbff,
      transparent: true,
      opacity: 0.58
    });
    const lightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25
    });

    box(0, -8, 0, 1100, 16, 980, floorMat);
    box(0, 230, -500, 1100, 460, 22, wallMat);
    box(-560, 230, 0, 22, 460, 980, wallMat);
    box(560, 230, 0, 22, 460, 980, wallMat);

    box(-350, 215, -150, 330, 22, 380, floorMat);
    box(350, 215, -150, 330, 22, 380, floorMat);
    box(0, 215, -390, 820, 22, 140, floorMat);

    for (let i = 0; i < 13; i++) {
      box(-300 + i * 18, 8 + i * 8, 230 - i * 34, 125, 16, 36, trimMat);
      box(300 - i * 18, 8 + i * 8, 230 - i * 34, 125, 16, 36, trimMat);
    }

    box(-350, 258, 48, 340, 35, 16, railMat);
    box(350, 258, 48, 340, 35, 16, railMat);
    box(0, 258, -310, 820, 35, 16, railMat);

    const windows = [
      [-360, 275, -515],
      [0, 290, -515],
      [360, 275, -515],
      [-570, 245, -180],
      [570, 245, -180]
    ];

    windows.forEach((p, i) => {
      const side = Math.abs(p[0]) > 560;
      const w = box(p[0], p[1], p[2], 165, 135, 6, glassMat);
      if (side) w.rotation.y = Math.PI / 2;

      if (!side) {
        box(p[0], p[1] + 73, p[2] + 2, 182, 10, 8, trimMat);
        box(p[0], p[1] - 73, p[2] + 2, 182, 10, 8, trimMat);
        box(p[0] - 91, p[1], p[2] + 2, 10, 150, 8, trimMat);
        box(p[0] + 91, p[1], p[2] + 2, 10, 150, 8, trimMat);
      }
    });

    const patch1 = box(-220, 2, 95, 260, 3, 130, lightMat);
    patch1.rotation.y = -0.35;

    const patch2 = box(190, 3, -40, 330, 3, 145, lightMat);
    patch2.rotation.y = 0.25;

    box(-430, 50, 305, 180, 90, 80, matLambert(0x2b1646)); // garage wall block
    box(430, 50, 305, 180, 90, 80, matLambert(0x2b1646));  // mini game room block
    box(0, 60, 330, 220, 120, 70, matLambert(0x20103d));   // match desk back
  }

  function createStations() {
    addStation("TV Preview", "tv", 0, -365, 0x00e5ff);
    addStation("Music Radio", "radio", 235, -65, 0xffd166);
    addStation("Match Setup", "match", 0, 255, 0xff2d95);
    addStation("Garage", "garage", -370, 250, 0xa855f7);
    addStation("Fish Game", "fish", 390, 245, 0x38bdf8);
    addStation("Friends", "friends", -405, -70, 0x84cc16);
    addStation("Rooms", "rooms", 405, -70, 0xf97316);
  }

  function addStation(label, type, x, z, color) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65
    });

    const geo = new THREE.CylinderGeometry(55, 55, 8, 40);
    const pad = new THREE.Mesh(geo, mat);
    pad.position.set(x, 6, z);
    state.scene.add(pad);

    const sprite = makeLabel(label, "#ffffff", colorToCSS(color));
    sprite.position.set(x, 80, z);
    state.scene.add(sprite);

    state.stations.push({
      label,
      type,
      x,
      z,
      radius: 95,
      pad,
      sprite
    });
  }

  function createGarageCars() {
    const cars = [
      { name: "Comet", color: 0xffff00, x: -465, z: 150 },
      { name: "Nova-X", color: 0x00e5ff, x: -365, z: 150 },
      { name: "Phantom", color: 0xff2d95, x: -265, z: 150 }
    ];

    cars.forEach(c => {
      const car = createCar({
        name: c.name,
        color: c.color,
        x: c.x,
        z: c.z,
        parked: true
      });
      state.garageCars.push(car);
    });
  }

  function createFakePlayers() {
    const bots = [
      { name: "Nova", color: 0x00e5ff, x: 220, z: 130 },
      { name: "Pixel", color: 0xff2d95, x: 295, z: 70 },
      { name: "Byte", color: 0x84cc16, x: 360, z: 130 }
    ];

    bots.forEach(b => {
      const car = createCar({
        name: b.name,
        color: b.color,
        x: b.x,
        z: b.z,
        fake: true
      });
      car.baseX = b.x;
      car.baseZ = b.z;
      state.fakePlayers.push(car);
    });
  }

  function createCar(options) {
    const group = new THREE.Group();
    group.position.set(options.x || 0, 18, options.z || 0);
    group.rotation.y = options.rot || 0;
    group.userData = {
      name: options.name,
      speed: 0,
      fake: !!options.fake,
      parked: !!options.parked,
      isPlayer: !!options.isPlayer
    };

    const bodyMat = matLambert(options.color || 0xffff00);
    const darkMat = matLambert(0x141022);
    const glowMat = new THREE.MeshBasicMaterial({ color: options.color || 0xffff00 });

    groupBox(group, 0, 9, 0, 54, 18, 78, bodyMat);
    groupBox(group, 0, 25, -4, 34, 20, 38, bodyMat);
    groupBox(group, 0, 26, 16, 24, 12, 18, glowMat);

    groupBox(group, -32, 4, -25, 12, 12, 18, darkMat);
    groupBox(group, 32, 4, -25, 12, 12, 18, darkMat);
    groupBox(group, -32, 4, 25, 12, 12, 18, darkMat);
    groupBox(group, 32, 4, 25, 12, 12, 18, darkMat);

    const label = makeLabel(options.name, "#ffffff", colorToCSS(options.color || 0xffff00));
    label.position.set(0, 70, 0);
    group.add(label);
    group.userData.label = label;

    state.scene.add(group);
    return group;
  }

  function createTVScreen() {
    state.tvCanvas = document.createElement("canvas");
    state.tvCanvas.width = 512;
    state.tvCanvas.height = 256;
    state.tvTexture = new THREE.CanvasTexture(state.tvCanvas);

    const screenMat = new THREE.MeshBasicMaterial({
      map: state.tvTexture,
      side: THREE.DoubleSide
    });

    box(0, 304, -508, 380, 210, 8, matLambert(0x151025));

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(330, 165), screenMat);
    screen.position.set(0, 304, -502);
    state.scene.add(screen);
  }

  function drawTVTexture() {
    if (!state.tvCanvas || !state.tvTexture) return;

    const ctx = state.tvCanvas.getContext("2d");
    const course = courses[state.courseIndex];
    const watched = getWatchTargetName();

    ctx.fillStyle = "#050816";
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = course.color;
    ctx.lineWidth = 12;
    ctx.shadowColor = course.color;
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.ellipse(160, 130, 95, 55, -0.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 25px sans-serif";
    ctx.fillText("MAP PREVIEW", 20, 38);

    ctx.fillStyle = course.color;
    ctx.font = "bold 31px sans-serif";
    ctx.fillText(course.name, 20, 82);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Watching:", 285, 118);

    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(watched, 285, 158);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "18px sans-serif";
    ctx.fillText("SPACE near TV = switch view", 20, 232);

    state.tvTexture.needsUpdate = true;
  }

  function animateLobby() {
    if (!state.scene || !state.player) return;

    state.t += 0.016;

    updatePlayerMovement();
    updateFakePlayers();
    updateCurrentStation();
    updateCamera();

    state.renderer.render(state.scene, state.camera);
    state.raf = requestAnimationFrame(animateLobby);
  }

  function updatePlayerMovement() {
    const p = state.player;
    const data = p.userData;

    const chatFocused = document.activeElement === id("chatInput") || document.activeElement === id("playerNameInput");
    if (chatFocused) return;

    const forward = state.keys.KeyW || state.keys.ArrowUp;
    const back = state.keys.KeyS || state.keys.ArrowDown;
    const left = state.keys.KeyA || state.keys.ArrowLeft;
    const right = state.keys.KeyD || state.keys.ArrowRight;

    if (left) p.rotation.y += 0.045;
    if (right) p.rotation.y -= 0.045;

    if (forward) data.speed += 0.22;
    if (back) data.speed -= 0.16;

    data.speed *= 0.92;
    data.speed = Math.max(-4.0, Math.min(6.0, data.speed));

    p.position.x += Math.sin(p.rotation.y) * data.speed;
    p.position.z += Math.cos(p.rotation.y) * data.speed;

    p.position.x = Math.max(-500, Math.min(500, p.position.x));
    p.position.z = Math.max(-420, Math.min(365, p.position.z));
  }

  function updateFakePlayers() {
    state.fakePlayers.forEach((car, i) => {
      const t = state.t + i * 2.2;
      car.position.x = car.baseX + Math.sin(t * 0.7) * 35;
      car.position.z = car.baseZ + Math.cos(t * 0.5) * 28;
      car.rotation.y = Math.sin(t * 0.6) * 0.8;
    });
  }

  function updateCurrentStation() {
    let nearest = null;
    let best = Infinity;

    state.stations.forEach(st => {
      const dx = state.player.position.x - st.x;
      const dz = state.player.position.z - st.z;
      const d = Math.sqrt(dx * dx + dz * dz);

      if (d < st.radius && d < best) {
        best = d;
        nearest = st;
      }
    });

    state.currentStation = nearest;

    const hint = id("interactHint");
    if (!hint) return;

    if (nearest) {
      hint.textContent = "Press SPACE to use: " + nearest.label;
    } else {
      hint.textContent = "Drive to a glowing station. Press SPACE to use it.";
    }
  }

  function updateCamera() {
    const p = state.player;
    const yaw = p.rotation.y;

    state.camera.position.x = p.position.x - Math.sin(yaw) * 360;
    state.camera.position.y = 225;
    state.camera.position.z = p.position.z - Math.cos(yaw) * 360;
    state.camera.lookAt(p.position.x, 60, p.position.z);
  }

  function bindKeys() {
    document.addEventListener("keydown", e => {
      if (!isLobbyOpen()) return;

      if (e.code === "Escape") {
        e.preventDefault();
        closeOnlineLobby();
        return;
      }

      if (e.code === "Enter") {
        const chat = id("chatInput");
        if (document.activeElement === chat) {
          e.preventDefault();
          sendChat();
        } else {
          e.preventDefault();
          chat.focus();
        }
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();

        const chatFocused = document.activeElement === id("chatInput") || document.activeElement === id("playerNameInput");
        if (!chatFocused) useCurrentStation();

        return;
      }

      state.keys[e.code] = true;
    });

    document.addEventListener("keyup", e => {
      state.keys[e.code] = false;
    });

    window.addEventListener("resize", () => {
      if (!isLobbyOpen() || !state.renderer || !state.camera) return;
      resizeLobbyCanvas();
      const canvas = id("lobbyCanvas");
      state.renderer.setSize(canvas.width, canvas.height, false);
      state.camera.aspect = canvas.width / canvas.height;
      state.camera.updateProjectionMatrix();
    });
  }

  function useCurrentStation() {
    const st = state.currentStation;

    if (!st) {
      addChatMessage("System", "No station nearby.");
      return;
    }

    if (st.type === "tv") {
      state.watchIndex++;
      drawTVTexture();
      updateHUD();
      addChatMessage("TV", "Now watching " + getWatchTargetName() + ".");
    }

    if (st.type === "radio") {
      nextRadioTrack();
    }

    if (st.type === "match") {
      nextCourse();
      addChatMessage("Match Desk", "Course changed to " + courses[state.courseIndex].name + ".");
    }

    if (st.type === "garage") {
      tryNextGarageCar();
    }

    if (st.type === "fish") {
      catchFish();
    }

    if (st.type === "friends") {
      addChatMessage("Friends", "Friend list is a placeholder until the real server is added.");
      addChatMessage("Friends", "Recent achievement: Nova unlocked Turbo Badge.");
    }

    if (st.type === "rooms") {
      addChatMessage("Rooms", "Room tools are placeholders: owner, invite, kick, private room, public room.");
    }
  }

  function savePlayerName() {
    const input = id("playerNameInput");
    const name = input.value.trim() || "Player";

    state.playerName = name;
    localStorage.setItem("neonDriftPlayerName", name);

    if (state.player) {
      state.player.userData.name = name;
      const oldLabel = state.player.userData.label;
      if (oldLabel) state.player.remove(oldLabel);

      const newLabel = makeLabel(name, "#ffffff", "#ffe66d");
      newLabel.position.set(0, 70, 0);
      state.player.add(newLabel);
      state.player.userData.label = newLabel;
    }

    drawTVTexture();
    updateHUD();
    addChatMessage("System", "Name saved as " + name + ".");
  }

  function sendChat() {
    const input = id("chatInput");
    const msg = input.value.trim();

    if (!msg) return;

    addChatMessage(state.playerName, msg);
    input.value = "";

    setTimeout(() => {
      const replies = [
        "Nice!",
        "Meet at the match desk?",
        "Try the radio!",
        "I parked my car in the garage.",
        "Fish game room is open."
      ];
      addChatMessage("Nova", replies[Math.floor(Math.random() * replies.length)]);
    }, 500);
  }

  function addChatMessage(name, msg) {
    const feed = id("chatFeed");
    if (!feed) return;

    const div = document.createElement("div");
    div.innerHTML = "<b>" + escapeHTML(name) + ":</b> " + escapeHTML(msg);
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
  }

  function nextCourse() {
    state.courseIndex = (state.courseIndex + 1) % courses.length;
    drawTVTexture();
    updateHUD();
  }

  function cycleLaps() {
    const choices = [1, 2, 3, 5, 7];
    const index = choices.indexOf(state.match.laps);
    state.match.laps = choices[(index + 1) % choices.length];
    updateHUD();
  }

  function cycleSpeed() {
    const choices = ["Cruise", "Normal", "Turbo", "Insane"];
    const index = choices.indexOf(state.match.speed);
    state.match.speed = choices[(index + 1) % choices.length];
    updateHUD();
  }

  function cycleItems() {
    const choices = ["None", "Normal", "Chaos"];
    const index = choices.indexOf(state.match.items);
    state.match.items = choices[(index + 1) % choices.length];
    updateHUD();
  }

  function startMatchLocal() {
    addChatMessage("Match Desk", "Starting local test match on " + courses[state.courseIndex].name + ".");
    addChatMessage("System", "Real online match launching comes after the server is added.");
  }

  function kickFakePlayer() {
    const kicked = state.fakePlayers.pop();

    if (!kicked) {
      addChatMessage("Room Owner", "No fake players left to kick.");
      return;
    }

    state.scene.remove(kicked);
    addChatMessage("Room Owner", "Kicked fake player " + kicked.userData.name + ".");
    drawTVTexture();
    updateHUD();
  }

  function nextRadioTrack() {
    state.radioIndex = (state.radioIndex + 1) % courses.length;
    state.courseIndex = state.radioIndex;

    const course = courses[state.radioIndex];
    startMusic(course);
    drawTVTexture();
    updateHUD();
    addChatMessage("Radio", "Now playing: " + course.name + " theme.");
  }

  function startMusic(course) {
    stopMusic();

    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) {
      addChatMessage("Radio", "This browser cannot play generated lobby music.");
      return;
    }

    state.audioCtx = new AudioClass();

    const notes = [1, 1.25, 1.5, 2, 1.5, 1.25];
    let step = 0;

    state.musicTimer = setInterval(() => {
      if (!state.audioCtx) return;

      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();

      osc.type = step % 2 === 0 ? "triangle" : "square";
      osc.frequency.value = course.base * notes[step % notes.length];

      gain.gain.setValueAtTime(0.0001, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.035, state.audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(state.audioCtx.destination);

      osc.start();
      osc.stop(state.audioCtx.currentTime + 0.18);

      step++;
    }, course.beat);
  }

  function stopMusic() {
    if (state.musicTimer) {
      clearInterval(state.musicTimer);
      state.musicTimer = null;
    }

    if (state.audioCtx) {
      try { state.audioCtx.close(); } catch (e) {}
      state.audioCtx = null;
    }
  }

  function tryNextGarageCar() {
    const options = [
      { name: "Comet", color: 0xffff00 },
      { name: "Nova-X", color: 0x00e5ff },
      { name: "Phantom", color: 0xff2d95 },
      { name: "Tracker", color: 0xff8c00 },
      { name: "Voltbike", color: 0x8b5cf6 }
    ];

    const current = id("garageText").textContent;
    let index = options.findIndex(o => o.name === current);
    index = (index + 1) % options.length;

    const next = options[index];
    state.carColor = next.color;

    if (state.player) {
      state.scene.remove(state.player);
      state.player = createCar({
        name: state.playerName,
        color: state.carColor,
        x: 0,
        z: 160,
        isPlayer: true
      });
    }

    id("garageText").textContent = next.name;
    addChatMessage("Garage", "You are trying the " + next.name + ".");
  }

  function catchFish() {
    state.fishCaught++;
    id("fishText").textContent = String(state.fishCaught);

    const fish = ["Neon Guppy", "Laser Trout", "Pixel Carp", "Turbo Tuna", "Glow Eel"];
    addChatMessage("Fish Game", "You caught a " + fish[Math.floor(Math.random() * fish.length)] + "!");
  }

  function updateHUD() {
    const course = courses[state.courseIndex];

    if (id("matchCourse")) id("matchCourse").textContent = course.name;
    if (id("matchLaps")) id("matchLaps").textContent = String(state.match.laps);
    if (id("matchSpeed")) id("matchSpeed").textContent = state.match.speed;
    if (id("matchItems")) id("matchItems").textContent = state.match.items;
    if (id("radioText")) id("radioText").textContent = state.radioIndex >= 0 ? courses[state.radioIndex].name : "Off";
    if (id("tvText")) id("tvText").textContent = course.name + " / " + getWatchTargetName();
  }

  function getWatchTargetName() {
    const names = [state.playerName].concat(state.fakePlayers.map(p => p.userData.name));
    if (names.length === 0) return state.playerName;
    return names[state.watchIndex % names.length];
  }

  function isLobbyOpen() {
    const lobby = id("onlineLobby");
    return lobby && !lobby.classList.contains("hide");
  }

  function matLambert(color) {
    return new THREE.MeshLambertMaterial({ color });
  }

  function box(x, y, z, sx, sy, sz, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    return mesh;
  }

  function groupBox(group, x, y, z, sx, sy, sz, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }

  function makeLabel(text, fg, bg) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bg || "rgba(0,0,0,.55)";
    roundRect(ctx, 8, 10, 240, 44, 14);
    ctx.fill();

    ctx.strokeStyle = fg || "#ffffff";
    ctx.lineWidth = 3;
    roundRect(ctx, 8, 10, 240, 44, 14);
    ctx.stroke();

    ctx.fillStyle = fg || "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 33);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(130, 32, 1);
    return sprite;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function colorToCSS(num) {
    return "#" + num.toString(16).padStart(6, "0");
  }

  function escapeHTML(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function drawFlatLobby(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#dff7ff";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#fff2d2";
    ctx.fillRect(80, 80, w - 160, h - 220);

    ctx.fillStyle = "#f1e4c6";
    ctx.fillRect(60, h - 220, w - 120, 180);

    ctx.fillStyle = "#d9fbff";
    ctx.fillRect(140, 120, 140, 90);
    ctx.fillRect(w / 2 - 70, 110, 140, 100);
    ctx.fillRect(w - 280, 120, 140, 90);

    ctx.strokeStyle = "#caa66d";
    ctx.lineWidth = 8;
    ctx.strokeRect(140, 120, 140, 90);
    ctx.strokeRect(w / 2 - 70, 110, 140, 100);
    ctx.strokeRect(w - 280, 120, 140, 90);

    ctx.fillStyle = "#00e5ff";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ONLINE LOBBY HUB", w / 2, 55);

    ctx.fillStyle = "#ff2d95";
    ctx.beginPath();
    ctx.arc(w / 2, h - 120, 42, 0, Math.PI * 2);
    ctx.fill();
  }
})();
