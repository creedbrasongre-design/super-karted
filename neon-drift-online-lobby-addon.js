/* Neon Drift Online Lobby Add-on V5
   Whole-file replacement for neon-drift-online-lobby-addon.js.

   Adds:
   - ONLINE PLAY button
   - driveable lobby car
   - name above player car
   - race-quality neon lobby art
   - real object interaction stations, not simple pads
   - TV preview console
   - radio/jukebox with bass + melody + chords + drums
   - match setup desk
   - garage tool station / car lift
   - aquarium fish mini-game machine
   - friends computer terminal
   - room doorway / owner tools placeholder
   - fake chat / fake players until the real server is added
*/

(function () {
  "use strict";

  const COURSES = [
    { name: "Neon Bay", color: 0x00e5ff, css: "#00e5ff", base: 220, beat: 280 },
    { name: "Solar Dunes", color: 0xff9f1c, css: "#ff9f1c", base: 247, beat: 330 },
    { name: "Glacier", color: 0x93c5fd, css: "#93c5fd", base: 196, beat: 390 },
    { name: "Midnight City", color: 0xff2d95, css: "#ff2d95", base: 277, beat: 250 },
    { name: "Ember Valley", color: 0xff6b00, css: "#ff6b00", base: 330, beat: 300 },
    { name: "Aurora Falls", color: 0x7dd3fc, css: "#7dd3fc", base: 185, beat: 360 },
    { name: "Sakura Rush", color: 0xffb4d6, css: "#ffb4d6", base: 294, beat: 310 },
    { name: "Crystal Caverns", color: 0x67e8f9, css: "#67e8f9", base: 208, beat: 340 },
    { name: "Skyline Speedway", color: 0xc026d3, css: "#c026d3", base: 262, beat: 250 },
    { name: "Canyon Blaze", color: 0xf97316, css: "#f97316", base: 311, beat: 290 }
  ];

  const CARS = [
    { name: "Comet", color: 0xffff00 },
    { name: "Nova-X", color: 0x00e5ff },
    { name: "Phantom", color: 0xff2d95 },
    { name: "Tracker", color: 0xff8c00 },
    { name: "Voltbike", color: 0x8b5cf6 }
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
    stations: [],
    currentStation: null,
    t: 0,
    courseIndex: 0,
    radioIndex: -1,
    watchIndex: 0,
    fish: 0,
    carIndex: 0,
    playerName: localStorage.getItem("neonDriftPlayerName") || "Player",
    carColor: 0xffff00,
    audioCtx: null,
    musicTimer: null,
    tvCanvas: null,
    tvTexture: null,
    match: { laps: 3, speed: "Normal", items: "Normal" }
  };

  function id(x) {
    return document.getElementById(x);
  }

  function setup() {
    if (state.ready) return;
    state.ready = true;
    addCSS();
    addOnlineButton();
    addLobbyScreen();
    bindKeys();
    window.openOnlineLobby = openOnlineLobby;
    window.closeOnlineLobby = closeOnlineLobby;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }

  function addCSS() {
    if (id("onlineLobbyCSS")) return;

    const style = document.createElement("style");
    style.id = "onlineLobbyCSS";
    style.textContent = `
      #onlineLobby{
        position:fixed; inset:0; z-index:99999; overflow:hidden; color:white;
        background:
          radial-gradient(circle at 25% 10%,rgba(0,229,255,.18),transparent 30%),
          radial-gradient(circle at 75% 18%,rgba(255,45,149,.20),transparent 28%),
          linear-gradient(180deg,#120313,#1b0712 48%,#2b1005);
      }
      #onlineLobby.hide{display:none!important;}
      #lobbyCanvas{width:100vw;height:100vh;display:block;background:#120313;}
      .lobbyPanel{
        position:absolute; box-sizing:border-box; padding:10px; border-radius:16px;
        color:white; background:rgba(9,7,28,.78); border:2px solid rgba(0,229,255,.35);
        box-shadow:0 0 22px rgba(0,229,255,.22), inset 0 0 18px rgba(255,255,255,.05);
        backdrop-filter:blur(7px); font-family:system-ui,sans-serif;
      }
      #lobbyTop{top:12px;left:50%;transform:translateX(-50%);width:min(940px,calc(100vw - 24px));display:flex;justify-content:space-between;align-items:center;gap:12px;}
      #lobbyTitle{font-family:"Press Start 2P",system-ui,sans-serif;font-size:15px;text-shadow:0 0 9px #00e5ff,0 0 18px #ff2d95;white-space:nowrap;}
      #playerNameInput{width:150px;border:2px solid rgba(0,229,255,.62);background:rgba(255,255,255,.12);color:white;border-radius:10px;padding:9px;outline:none;text-align:center;font-weight:900;}
      .lobbyBtn,.tinyBtn{cursor:pointer;color:white;font-weight:900;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(135deg,#00e5ff,#7b2cff 55%,#ff2d95);box-shadow:0 0 12px rgba(0,229,255,.35);}
      .lobbyBtn{padding:9px 12px;border:0;} .lobbyBtn.ghost{background:rgba(255,255,255,.14);} .tinyBtn{padding:5px 8px;margin:2px;background:rgba(0,229,255,.14);}
      #lobbyHelp{left:12px;top:88px;width:255px;font-size:12px;line-height:1.45;}
      #lobbyHelp b,#chatPanel h3,#matchPanel h3,#sideInfo h3{color:#67e8f9;}
      #chatPanel{right:12px;top:88px;width:310px;font-size:12px;}
      #chatFeed{height:156px;overflow:auto;background:rgba(0,0,0,.30);border-radius:10px;padding:8px;margin-bottom:8px;}
      #chatFeed div{margin-bottom:6px;}
      #chatInput{width:calc(100% - 72px);border:2px solid rgba(0,229,255,.45);background:rgba(255,255,255,.11);color:white;border-radius:9px;padding:8px;outline:none;}
      #matchPanel{right:12px;bottom:88px;width:310px;font-size:12px;}
      #sideInfo{left:12px;bottom:88px;width:292px;font-size:12px;line-height:1.45;}
      #interactHint{left:50%;bottom:18px;transform:translateX(-50%);width:min(650px,calc(100vw - 24px));text-align:center;font-weight:900;font-size:14px;}
      .settingLine{display:flex;justify-content:space-between;gap:10px;margin:7px 0;}
      .tag{display:inline-block;padding:3px 6px;margin:2px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);}
      @media (max-width:900px){#lobbyHelp,#chatPanel,#matchPanel,#sideInfo{width:238px;font-size:11px;}#lobbyTop{flex-wrap:wrap;justify-content:center;}}
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

    const menu = document.querySelector("#menu .menucard") || document.querySelector("#menu") || document.querySelector(".menucard") || document.body;
    menu.appendChild(button);
  }

  function addLobbyScreen() {
    if (id("onlineLobby")) return;

    const lobby = document.createElement("div");
    lobby.id = "onlineLobby";
    lobby.className = "screen hide";
    lobby.innerHTML = `
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
        SPACE = use object<br>
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
        Room: <b style="color:#ffe66d">LOCAL-${Math.floor(1000 + Math.random() * 9000)}</b><br>
        Radio: <span id="radioText">Off</span><br>
        TV: <span id="tvText">Neon Bay / Player</span><br>
        Garage Car: <span id="garageText">Comet</span><br>
        Fish Caught: <span id="fishText">0</span><br>
        <div style="margin-top:8px">
          <span class="tag">Friends placeholder</span>
          <span class="tag">Achievements placeholder</span>
          <span class="tag">Owner tools placeholder</span>
        </div>
      </div>

      <div id="interactHint" class="lobbyPanel">
        Drive near a real object. Press SPACE to use it.
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

    addChat("System", "Welcome to the local lobby test.");
    addChat("Nova", "Use the real objects now: TV console, jukebox, match desk, garage tools, aquarium, friend terminal, and room door.");
  }

  function openOnlineLobby() {
    document.querySelectorAll(".screen").forEach(screen => {
      if (screen.id !== "onlineLobby") screen.classList.add("hide");
    });
    id("onlineLobby").classList.remove("hide");
    resizeCanvas();
    buildWorld();
    updateHUD();
  }

  function closeOnlineLobby() {
    id("onlineLobby").classList.add("hide");
    stopMusic();
    stopWorld();
    const menu = id("menu") || id("mainMenu") || document.querySelector(".screen");
    if (menu) menu.classList.remove("hide");
  }

  function resizeCanvas() {
    const canvas = id("lobbyCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function stopWorld() {
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
    state.stations = [];
    state.currentStation = null;
    state.tvCanvas = null;
    state.tvTexture = null;
  }

  function buildWorld() {
    const canvas = id("lobbyCanvas");
    if (!canvas) return;

    if (typeof THREE === "undefined") {
      drawFlatLobby(canvas);
      id("interactHint").textContent = "THREE was not found, so the lobby is in flat preview mode.";
      return;
    }

    stopWorld();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x160515, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x160515, 900, 3000);
    const camera = new THREE.PerspectiveCamera(58, canvas.width / canvas.height, 1, 6000);

    state.renderer = renderer;
    state.scene = scene;
    state.camera = camera;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a0710, 1.12));
    addPointLight(0xffb000, -260, 260, 200, 1.1, 1100);
    addPointLight(0x00e5ff, 340, 250, -160, 1.0, 900);
    addPointLight(0xff2d95, -340, 250, -160, 1.0, 900);

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(-420, 620, 420);
    scene.add(sun);

    createRoomGeometry();
    createObjectStations();
    createGarageCars();
    createFakePlayers();

    state.player = createCar({ name: state.playerName, color: state.carColor, x: 0, z: 170, isPlayer: true });
    createTV();
    drawTV();
    animate();
  }

  function createRoomGeometry() {
    const floorMat = lambert(0x1b0926);
    const wallMat = lambert(0x12031f);
    const darkMat = lambert(0x070611);
    const purpleMat = lambert(0x2b1646);
    const goldMat = lambert(0xf6b21a);
    const cyanMat = basic(0x00e5ff);
    const pinkMat = basic(0xff2d95);
    const yellowMat = basic(0xffea00);

    box(0, -8, 0, 1200, 16, 1040, floorMat);
    box(0, 240, -525, 1200, 480, 24, wallMat);
    box(-610, 240, 0, 24, 480, 1040, wallMat);
    box(610, 240, 0, 24, 480, 1040, wallMat);

    const lane1 = box(0, 0, 110, 760, 5, 130, transparentBasic(0xffd000, 0.56));
    lane1.rotation.y = -0.08;
    const lane2 = box(-260, 1, -105, 360, 5, 52, transparentBasic(0x00e5ff, 0.48));
    lane2.rotation.y = 0.34;
    const lane3 = box(260, 1, -105, 360, 5, 52, transparentBasic(0xff2d95, 0.48));
    lane3.rotation.y = -0.34;

    box(-365, 220, -155, 350, 22, 400, purpleMat);
    box(365, 220, -155, 350, 22, 400, purpleMat);
    box(0, 220, -415, 880, 22, 150, purpleMat);

    box(-365, 268, 55, 360, 28, 16, cyanMat);
    box(365, 268, 55, 360, 28, 16, pinkMat);
    box(0, 268, -330, 880, 28, 16, yellowMat);

    for (let i = 0; i < 13; i++) {
      box(-320 + i * 20, 8 + i * 8, 250 - i * 35, 130, 16, 36, goldMat);
      box(320 - i * 20, 8 + i * 8, 250 - i * 35, 130, 16, 36, goldMat);
      if (i % 2 === 0) {
        box(-392 + i * 20, 23 + i * 8, 250 - i * 35, 10, 40, 10, cyanMat);
        box(392 - i * 20, 23 + i * 8, 250 - i * 35, 10, 40, 10, pinkMat);
      }
    }

    neonRing(-470, 140, -285, 95, 0x00e5ff);
    neonRing(470, 140, -285, 95, 0xff2d95);
    neonRing(0, 155, -455, 115, 0xffea00);

    tower(-520, 60, 240, 0xffea00);
    tower(520, 60, 240, 0xff2d95);
    tower(-520, 60, -90, 0x00e5ff);
    tower(520, 60, -90, 0xffea00);
    tower(-220, 60, -380, 0xff2d95);
    tower(220, 60, -380, 0x00e5ff);

    const glass = transparentBasic(0x8ff7ff, 0.46);
    [[-360, 285, -538], [0, 300, -538], [360, 285, -538]].forEach(p => {
      box(p[0], p[1], p[2], 170, 132, 6, glass);
      box(p[0], p[1] + 72, p[2] + 3, 190, 10, 10, cyanMat);
      box(p[0], p[1] - 72, p[2] + 3, 190, 10, 10, pinkMat);
      box(p[0] - 95, p[1], p[2] + 3, 10, 150, 10, yellowMat);
      box(p[0] + 95, p[1], p[2] + 3, 10, 150, 10, yellowMat);
    });

    const patch1 = box(-250, 3, 85, 285, 4, 120, transparentBasic(0xffffff, 0.18));
    patch1.rotation.y = -0.35;
    const patch2 = box(235, 3, -35, 350, 4, 130, transparentBasic(0xffffff, 0.18));
    patch2.rotation.y = 0.26;

    box(-445, 55, 320, 210, 110, 95, darkMat);
    box(445, 55, 320, 210, 110, 95, darkMat);
    box(-445, 116, 320, 230, 12, 105, cyanMat);
    box(445, 116, 320, 230, 12, 105, pinkMat);

    box(0, 60, 342, 250, 120, 80, darkMat);
    box(0, 125, 300, 270, 12, 12, yellowMat);
    box(0, 90, 300, 220, 10, 12, cyanMat);

    parkingRing(-465, 150, 0x00e5ff);
    parkingRing(-365, 150, 0xff2d95);
    parkingRing(-265, 150, 0xffea00);
  }

  function createObjectStations() {
    addObjectStation("TV Preview", "tv", 0, -365, 0x00e5ff, makeTVConsole);
    addObjectStation("Music Radio", "radio", 235, -65, 0xffd166, makeRadioMachine);
    addObjectStation("Match Setup", "match", 0, 255, 0xff2d95, makeMatchConsole);
    addObjectStation("Garage", "garage", -370, 250, 0xa855f7, makeGarageTools);
    addObjectStation("Fish Game", "fish", 390, 245, 0x38bdf8, makeFishTank);
    addObjectStation("Friends", "friends", -405, -70, 0x84cc16, makeFriendsTerminal);
    addObjectStation("Rooms", "rooms", 405, -70, 0xf97316, makeRoomDoor);
  }

  function addObjectStation(label, type, x, z, color, maker) {
    maker(x, z, color);
    const labelSprite = makeLabel(label, "#ffffff", colorToCSS(color));
    labelSprite.position.set(x, 125, z);
    state.scene.add(labelSprite);
    addPointLight(color, x, 72, z, 0.68, 270);
    state.stations.push({ label, type, x, z, radius: 112 });
  }

  function makeTVConsole(x, z, color) {
    box(x, 22, z, 130, 44, 70, lambert(0x070611));
    box(x, 50, z - 12, 105, 12, 12, basic(color));
    box(x - 38, 56, z + 20, 22, 8, 22, basic(0xffea00));
    box(x, 56, z + 20, 22, 8, 22, basic(0x00e5ff));
    box(x + 38, 56, z + 20, 22, 8, 22, basic(0xff2d95));
    cylinder(x, 88, z - 22, 4, 4, 55, basic(color));
    sphere(x, 120, z - 22, 14, basic(color));
  }

  function makeRadioMachine(x, z, color) {
    box(x, 38, z, 90, 76, 55, lambert(0x12031f));
    box(x, 80, z, 80, 12, 48, basic(color));
    box(x, 48, z - 30, 66, 36, 8, basic(0x00e5ff));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(38, 5, 12, 48), basic(0xff2d95));
    ring.position.set(x, 56, z - 34);
    state.scene.add(ring);
    const s1 = cylinder(x - 25, 26, z - 34, 17, 17, 8, lambert(0x05030a));
    s1.rotation.x = Math.PI / 2;
    const s2 = cylinder(x + 25, 26, z - 34, 17, 17, 8, lambert(0x05030a));
    s2.rotation.x = Math.PI / 2;
    box(x - 24, 92, z - 34, 8, 20, 6, basic(0x00e5ff));
    box(x - 8, 98, z - 34, 8, 32, 6, basic(0xffea00));
    box(x + 8, 89, z - 34, 8, 14, 6, basic(0xff2d95));
    box(x + 24, 101, z - 34, 8, 38, 6, basic(0x00e5ff));
  }

  function makeMatchConsole(x, z, color) {
    box(x, 34, z, 150, 68, 80, lambert(0x070611));
    box(x, 72, z - 30, 130, 12, 12, basic(color));
    box(x, 48, z - 44, 110, 38, 8, basic(0x00e5ff));
    cylinder(x + 80, 95, z, 4, 4, 110, basic(0xffea00));
    box(x + 104, 130, z, 48, 30, 5, basic(0xff2d95));
    box(x - 52, 75, z + 30, 22, 12, 22, basic(0xffea00));
    box(x, 75, z + 30, 22, 12, 22, basic(0x00e5ff));
    box(x + 52, 75, z + 30, 22, 12, 22, basic(0xff2d95));
  }

  function makeGarageTools(x, z, color) {
    box(x, 25, z, 100, 50, 60, lambert(0x170827));
    box(x, 55, z, 105, 10, 65, basic(color));
    box(x - 32, 38, z - 35, 24, 10, 8, basic(0x00e5ff));
    box(x, 38, z - 35, 24, 10, 8, basic(0xffea00));
    box(x + 32, 38, z - 35, 24, 10, 8, basic(0xff2d95));
    box(x - 60, 36, z + 30, 12, 72, 12, basic(color));
    box(x + 60, 36, z + 30, 12, 72, 12, basic(color));
    box(x, 75, z + 30, 140, 10, 12, basic(color));
    cylinder(x - 92, 55, z - 10, 5, 5, 55, basic(0xffea00)).rotation.z = 0.7;
    sphere(x - 112, 78, z - 10, 12, basic(0xffea00));
  }

  function makeFishTank(x, z, color) {
    box(x, 24, z, 130, 48, 70, lambert(0x07131f));
    box(x, 62, z, 115, 70, 60, transparentBasic(0x38bdf8, 0.45));
    box(x, 102, z, 125, 10, 70, basic(color));
    for (let i = 0; i < 4; i++) {
      const fish = new THREE.Mesh(new THREE.ConeGeometry(9, 20, 4), basic(i % 2 ? 0xffea00 : 0xff2d95));
      fish.position.set(x - 38 + i * 25, 62 + (i % 2) * 12, z - 40);
      fish.rotation.z = Math.PI / 2;
      state.scene.add(fish);
    }
    box(x, 110, z - 38, 95, 12, 12, basic(0x00e5ff));
  }

  function makeFriendsTerminal(x, z, color) {
    box(x, 30, z, 110, 60, 60, lambert(0x07120b));
    box(x, 72, z - 33, 90, 55, 8, basic(0x84cc16));
    box(x, 18, z - 48, 95, 12, 22, basic(color));
    cylinder(x - 38, 103, z - 31, 5, 5, 52, basic(0x00e5ff));
    cylinder(x + 38, 103, z - 31, 5, 5, 52, basic(0xff2d95));
    sphere(x - 38, 132, z - 31, 11, basic(0x00e5ff));
    sphere(x + 38, 132, z - 31, 11, basic(0xff2d95));
  }

  function makeRoomDoor(x, z, color) {
    box(x, 65, z, 130, 130, 25, lambert(0x17080a));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(70, 7, 14, 64), basic(color));
    ring.position.set(x, 78, z - 16);
    ring.scale.y = 1.25;
    state.scene.add(ring);
    box(x, 80, z - 20, 80, 115, 8, transparentBasic(0xff9f1c, 0.35));
    box(x - 55, 20, z + 10, 20, 40, 20, basic(0xffea00));
    box(x + 55, 20, z + 10, 20, 40, 20, basic(0xffea00));
  }

  function createGarageCars() {
    [
      { name: "Comet", color: 0xffff00, x: -465, z: 150 },
      { name: "Nova-X", color: 0x00e5ff, x: -365, z: 150 },
      { name: "Phantom", color: 0xff2d95, x: -265, z: 150 }
    ].forEach(c => createCar(c));
  }

  function createFakePlayers() {
    [
      { name: "Nova", color: 0x00e5ff, x: 220, z: 130 },
      { name: "Pixel", color: 0xff2d95, x: 295, z: 70 },
      { name: "Byte", color: 0x84cc16, x: 360, z: 130 }
    ].forEach(b => {
      const car = createCar({ name: b.name, color: b.color, x: b.x, z: b.z, fake: true });
      car.baseX = b.x;
      car.baseZ = b.z;
      state.fakePlayers.push(car);
    });
  }

  function createCar(o) {
    const group = new THREE.Group();
    group.position.set(o.x || 0, 18, o.z || 0);
    group.rotation.y = o.rot || 0;
    group.userData = { name: o.name || "Player", speed: 0, fake: !!o.fake, isPlayer: !!o.isPlayer };

    const body = lambert(o.color || 0xffff00);
    const dark = lambert(0x070611);
    const tire = lambert(0x03030a);
    const glow = basic(o.color || 0xffff00);
    const glass = basic(0x00e5ff);

    groupBox(group, 0, 9, 0, 58, 18, 82, body);
    groupBox(group, 0, 25, -6, 36, 22, 40, body);
    groupBox(group, 0, 28, 15, 26, 10, 20, glass);
    groupBox(group, 0, 13, 46, 38, 10, 10, glow);
    groupBox(group, 0, 12, -46, 40, 10, 8, dark);
    groupBox(group, -34, 4, -27, 13, 14, 20, tire);
    groupBox(group, 34, 4, -27, 13, 14, 20, tire);
    groupBox(group, -34, 4, 27, 13, 14, 20, tire);
    groupBox(group, 34, 4, 27, 13, 14, 20, tire);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(18, 28, 4), glow);
    nose.position.set(0, 15, 55);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.z = Math.PI / 4;
    group.add(nose);

    const label = makeLabel(o.name || "Player", "#ffffff", colorToCSS(o.color || 0xffff00));
    label.position.set(0, 76, 0);
    group.add(label);
    group.userData.label = label;

    const light = new THREE.PointLight(o.color || 0xffff00, 0.28, 130);
    light.position.set(0, 25, 0);
    group.add(light);
    state.scene.add(group);
    return group;
  }

  function createTV() {
    state.tvCanvas = document.createElement("canvas");
    state.tvCanvas.width = 512;
    state.tvCanvas.height = 256;
    state.tvTexture = new THREE.CanvasTexture(state.tvCanvas);

    box(0, 304, -508, 395, 220, 8, lambert(0x070611));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(210, 6, 12, 80), basic(0xffea00));
    ring.position.set(0, 304, -500);
    ring.scale.y = 0.55;
    state.scene.add(ring);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(330, 165),
      new THREE.MeshBasicMaterial({ map: state.tvTexture, side: THREE.DoubleSide })
    );
    screen.position.set(0, 304, -502);
    state.scene.add(screen);
  }

  function drawTV() {
    if (!state.tvCanvas || !state.tvTexture) return;
    const ctx = state.tvCanvas.getContext("2d");
    const course = COURSES[state.courseIndex];
    const watched = getWatchTargetName();

    ctx.fillStyle = "#050816";
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = course.css;
    ctx.lineWidth = 12;
    ctx.shadowColor = course.css;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(160, 130, 95, 55, -0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 25px sans-serif";
    ctx.fillText("MAP PREVIEW", 20, 38);
    ctx.fillStyle = course.css;
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

  function animate() {
    if (!state.scene || !state.player) return;
    state.t += 0.016;
    updatePlayer();
    updateFakePlayers();
    animateObjects();
    updateStation();
    updateCamera();
    state.renderer.render(state.scene, state.camera);
    state.raf = requestAnimationFrame(animate);
  }

  function animateObjects() {}

  function updatePlayer() {
    const p = state.player;
    const d = p.userData;
    const focused = document.activeElement === id("chatInput") || document.activeElement === id("playerNameInput");
    if (focused) return;

    const fwd = state.keys.KeyW || state.keys.ArrowUp;
    const back = state.keys.KeyS || state.keys.ArrowDown;
    const left = state.keys.KeyA || state.keys.ArrowLeft;
    const right = state.keys.KeyD || state.keys.ArrowRight;

    if (left) p.rotation.y += 0.045;
    if (right) p.rotation.y -= 0.045;
    if (fwd) d.speed += 0.22;
    if (back) d.speed -= 0.16;

    d.speed *= 0.92;
    d.speed = Math.max(-4.0, Math.min(6.0, d.speed));
    p.position.x += Math.sin(p.rotation.y) * d.speed;
    p.position.z += Math.cos(p.rotation.y) * d.speed;
    p.position.x = Math.max(-525, Math.min(525, p.position.x));
    p.position.z = Math.max(-430, Math.min(375, p.position.z));
  }

  function updateFakePlayers() {
    state.fakePlayers.forEach((car, i) => {
      const t = state.t + i * 2.2;
      car.position.x = car.baseX + Math.sin(t * 0.7) * 35;
      car.position.z = car.baseZ + Math.cos(t * 0.5) * 28;
      car.rotation.y = Math.sin(t * 0.6) * 0.8;
    });
  }

  function updateStation() {
    let nearest = null;
    let best = Infinity;
    state.stations.forEach(st => {
      const dx = state.player.position.x - st.x;
      const dz = state.player.position.z - st.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < st.radius && dist < best) {
        best = dist;
        nearest = st;
      }
    });
    state.currentStation = nearest;
    id("interactHint").textContent = nearest ? "Press SPACE to use: " + nearest.label : "Drive near a real object. Press SPACE to use it.";
  }

  function updateCamera() {
    const p = state.player;
    const yaw = p.rotation.y;
    state.camera.position.x = p.position.x - Math.sin(yaw) * 380;
    state.camera.position.y = 230;
    state.camera.position.z = p.position.z - Math.cos(yaw) * 380;
    state.camera.lookAt(p.position.x, 62, p.position.z);
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
        const focused = document.activeElement === id("chatInput") || document.activeElement === id("playerNameInput");
        if (!focused) useStation();
        return;
      }
      state.keys[e.code] = true;
    });

    document.addEventListener("keyup", e => {
      state.keys[e.code] = false;
    });

    window.addEventListener("resize", () => {
      if (!isLobbyOpen() || !state.renderer || !state.camera) return;
      resizeCanvas();
      const canvas = id("lobbyCanvas");
      state.renderer.setSize(canvas.width, canvas.height, false);
      state.camera.aspect = canvas.width / canvas.height;
      state.camera.updateProjectionMatrix();
    });
  }

  function useStation() {
    const st = state.currentStation;
    if (!st) {
      addChat("System", "No object nearby.");
      return;
    }

    if (st.type === "tv") {
      state.watchIndex++;
      drawTV();
      updateHUD();
      addChat("TV", "Now watching " + getWatchTargetName() + ".");
    } else if (st.type === "radio") {
      nextRadio();
    } else if (st.type === "match") {
      nextCourse();
      addChat("Match Desk", "Course changed to " + COURSES[state.courseIndex].name + ".");
    } else if (st.type === "garage") {
      changeCar();
    } else if (st.type === "fish") {
      state.fish++;
      id("fishText").textContent = String(state.fish);
      const fish = ["Neon Guppy", "Laser Trout", "Pixel Carp", "Turbo Tuna", "Glow Eel"];
      addChat("Fish Game", "You caught a " + fish[Math.floor(Math.random() * fish.length)] + "!");
    } else if (st.type === "friends") {
      addChat("Friends", "Friend list is a placeholder until the server is added.");
      addChat("Friends", "Recent achievement: Nova unlocked Turbo Badge.");
    } else if (st.type === "rooms") {
      addChat("Rooms", "Room tools placeholder: owner, invite, kick, private room, public room.");
    }
  }

  function savePlayerName() {
    const name = id("playerNameInput").value.trim() || "Player";
    state.playerName = name;
    localStorage.setItem("neonDriftPlayerName", name);
    if (state.player) {
      const old = state.player.userData.label;
      if (old) state.player.remove(old);
      const label = makeLabel(name, "#ffffff", "#ffe66d");
      label.position.set(0, 76, 0);
      state.player.add(label);
      state.player.userData.name = name;
      state.player.userData.label = label;
    }
    drawTV();
    updateHUD();
    addChat("System", "Name saved as " + name + ".");
  }

  function sendChat() {
    const input = id("chatInput");
    const msg = input.value.trim();
    if (!msg) return;
    addChat(state.playerName, msg);
    input.value = "";
    setTimeout(() => {
      const replies = ["Nice!", "Meet at the match desk?", "Try the radio!", "I parked my car in the garage.", "Fish game room is open."];
      addChat("Nova", replies[Math.floor(Math.random() * replies.length)]);
    }, 500);
  }

  function addChat(name, msg) {
    const feed = id("chatFeed");
    if (!feed) return;
    const div = document.createElement("div");
    div.innerHTML = "<b>" + escapeHTML(name) + ":</b> " + escapeHTML(msg);
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
  }

  function nextCourse() {
    state.courseIndex = (state.courseIndex + 1) % COURSES.length;
    drawTV();
    updateHUD();
  }

  function cycleLaps() {
    const choices = [1, 2, 3, 5, 7];
    state.match.laps = choices[(choices.indexOf(state.match.laps) + 1) % choices.length];
    updateHUD();
  }

  function cycleSpeed() {
    const choices = ["Cruise", "Normal", "Turbo", "Insane"];
    state.match.speed = choices[(choices.indexOf(state.match.speed) + 1) % choices.length];
    updateHUD();
  }

  function cycleItems() {
    const choices = ["None", "Normal", "Chaos"];
    state.match.items = choices[(choices.indexOf(state.match.items) + 1) % choices.length];
    updateHUD();
  }

  function startMatchLocal() {
    addChat("Match Desk", "Starting local test match on " + COURSES[state.courseIndex].name + ".");
    addChat("System", "Real online match launching comes after the server is added.");
  }

  function kickFakePlayer() {
    const kicked = state.fakePlayers.pop();
    if (!kicked) {
      addChat("Room Owner", "No fake players left to kick.");
      return;
    }
    state.scene.remove(kicked);
    addChat("Room Owner", "Kicked fake player " + kicked.userData.name + ".");
    drawTV();
    updateHUD();
  }

  function nextRadio() {
    state.radioIndex = (state.radioIndex + 1) % COURSES.length;
    state.courseIndex = state.radioIndex;
    const course = COURSES[state.radioIndex];
    startMusic(course);
    drawTV();
    updateHUD();
    addChat("Radio", "Now playing: " + course.name + " theme.");
  }

  function startMusic(course) {
    stopMusic();
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) {
      addChat("Radio", "This browser cannot play generated lobby music.");
      return;
    }

    state.audioCtx = new AudioClass();
    const ctx = state.audioCtx;
    const scale = [1, 1.125, 1.25, 1.5, 1.667, 2];
    const melody = [0, 2, 4, 2, 5, 4, 2, 1];
    const chordA = [1, 1.25, 1.5];
    const chordB = [1, 1.333, 1.667];
    let step = 0;

    state.musicTimer = setInterval(() => {
      if (!state.audioCtx) return;
      const now = ctx.currentTime;
      const base = course.base;

      playTone(base * (step % 8 < 4 ? 0.5 : 0.667), "sawtooth", 0.045, 0.18, now);

      const note = melody[step % melody.length];
      playTone(base * 2 * scale[note % scale.length], "triangle", 0.035, 0.16, now + 0.03);

      if (step % 2 === 0) {
        const chord = step % 4 === 0 ? chordA : chordB;
        chord.forEach(mult => playTone(base * mult, "square", 0.014, 0.22, now + 0.01));
      }

      playNoise(step % 4 === 0 ? 0.055 : 0.025, step % 4 === 0 ? 0.08 : 0.035, now + 0.005);

      step++;
    }, course.beat);
  }

  function playTone(freq, type, volume, length, startTime) {
    const ctx = state.audioCtx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + length);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + length + 0.02);
  }

  function playNoise(volume, length, startTime) {
    const ctx = state.audioCtx;
    if (!ctx) return;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * length));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + length);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(startTime);
    source.stop(startTime + length);
  }

  function stopMusic() {
    if (state.musicTimer) clearInterval(state.musicTimer);
    state.musicTimer = null;
    if (state.audioCtx) {
      try { state.audioCtx.close(); } catch (e) {}
    }
    state.audioCtx = null;
  }

  function changeCar() {
    state.carIndex = (state.carIndex + 1) % CARS.length;
    const next = CARS[state.carIndex];
    state.carColor = next.color;
    if (state.player) {
      const x = state.player.position.x;
      const z = state.player.position.z;
      const rot = state.player.rotation.y;
      state.scene.remove(state.player);
      state.player = createCar({ name: state.playerName, color: state.carColor, x, z, rot, isPlayer: true });
    }
    id("garageText").textContent = next.name;
    addChat("Garage", "You are trying the " + next.name + ".");
  }

  function updateHUD() {
    const course = COURSES[state.courseIndex];
    id("matchCourse").textContent = course.name;
    id("matchLaps").textContent = String(state.match.laps);
    id("matchSpeed").textContent = state.match.speed;
    id("matchItems").textContent = state.match.items;
    id("radioText").textContent = state.radioIndex >= 0 ? COURSES[state.radioIndex].name : "Off";
    id("tvText").textContent = course.name + " / " + getWatchTargetName();
  }

  function getWatchTargetName() {
    const names = [state.playerName].concat(state.fakePlayers.map(p => p.userData.name));
    return names[state.watchIndex % names.length] || state.playerName;
  }

  function isLobbyOpen() {
    const lobby = id("onlineLobby");
    return lobby && !lobby.classList.contains("hide");
  }

  function lambert(color) { return new THREE.MeshLambertMaterial({ color }); }
  function basic(color) { return new THREE.MeshBasicMaterial({ color }); }
  function transparentBasic(color, opacity) { return new THREE.MeshBasicMaterial({ color, transparent: true, opacity }); }

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

  function cylinder(x, y, z, rt, rb, h, mat) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 12), mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    return mesh;
  }

  function sphere(x, y, z, r, mat) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    return mesh;
  }

  function addPointLight(color, x, y, z, power, distance) {
    const light = new THREE.PointLight(color, power, distance);
    light.position.set(x, y, z);
    state.scene.add(light);
  }

  function neonRing(x, y, z, radius, color) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 8, 16, 64), basic(color));
    ring.position.set(x, y, z);
    ring.rotation.y = Math.PI / 2;
    state.scene.add(ring);
    addPointLight(color, x, y, z, 0.8, 280);
  }

  function tower(x, y, z, color) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(22, 38, 125, 5), lambert(0x080615));
    base.position.set(x, y, z);
    state.scene.add(base);
    const top = new THREE.Mesh(new THREE.ConeGeometry(32, 62, 5), basic(color));
    top.position.set(x, y + 94, z);
    state.scene.add(top);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(35, 4, 10, 32), basic(color));
    halo.position.set(x, y + 132, z);
    halo.rotation.x = Math.PI / 2;
    state.scene.add(halo);
    addPointLight(color, x, y + 100, z, 0.65, 240);
  }

  function parkingRing(x, z, color) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(66, 4, 12, 48), basic(color));
    ring.position.set(x, 12, z);
    ring.rotation.x = Math.PI / 2;
    state.scene.add(ring);
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
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
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
    ctx.fillStyle = "#160515";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1b0926";
    ctx.fillRect(80, 80, w - 160, h - 220);
    ctx.fillStyle = "#ffd000";
    ctx.globalAlpha = 0.55;
    ctx.fillRect(140, h - 190, w - 280, 80);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(220, 180, 90, 55, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#ff2d95";
    ctx.beginPath();
    ctx.ellipse(w - 220, 180, 90, 55, 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#ffea00";
    ctx.beginPath();
    ctx.ellipse(w / 2, 160, 110, 65, 0, 0, Math.PI * 2);
    ctx.stroke();
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
