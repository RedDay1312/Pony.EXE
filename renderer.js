(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const STORAGE = 'the-last-save-v1';
  const characters = {
    twilight: { name: 'TWILIGHT', color: '#b899e8', skill: 'MAGIC' },
    fluttershy: { name: 'FLUTTERSHY', color: '#f3c17a', skill: 'EMPATHY' },
    pinkie: { name: 'PINKIE PIE', color: '#f5a2c9', skill: 'CHAOS' },
    applejack: { name: 'APPLEJACK', color: '#ef9f55', skill: 'HARVEST' },
    rarity: { name: 'RARITY', color: '#b7a4ec', skill: 'FOCUS' },
    rainbow: { name: 'RAINBOW DASH', color: '#66cbe9', skill: 'SPEED' }
  };

  const npcNames = ['Twilight', 'Fluttershy', 'Pinkie Pie', 'Applejack', 'Rarity', 'Rainbow Dash'];
  const defaultState = () => ({
    version: 1,
    player: null,
    difficulty: 'NORMAL',
    scene: 'prologue',
    location: 'Ponyville',
    chapter: 'PROLOGUE — AN ORDINARY DAY',
    act: 0,
    friendship: 10,
    courage: 10,
    attention: 10,
    trust: 10,
    memory: 0,
    loop: 0,
    saves: 0,
    loads: 0,
    visits: {},
    minigames: {},
    endings: [],
    flags: { bookFound: false, bookOpened: false, doorSeen: false, otherPonyville: false, entityMet: false, coreReached: false, newGamePlus: false },
    inventory: [],
    relationships: Object.fromEntries(npcNames.map(n => [n, 20])),
    seenEvents: [],
    lastSaveLocation: 'Ponyville',
    corruption: 0,
    settings: { music: true, sfx: true, textSpeed: 1, shake: true, flash: true },
    playerName: '',
    endingHint: ''
  });

  let state = defaultState();
  let currentMiniCleanup = null;

  function persist() { localStorage.setItem(STORAGE, JSON.stringify(state)); }
  function recover() {
    try { const raw = localStorage.getItem(STORAGE); if (raw) state = Object.assign(defaultState(), JSON.parse(raw)); } catch { state = defaultState(); }
  }
  function resetState() { state = defaultState(); persist(); }
  function clamp(n, a=0, b=100) { return Math.max(a, Math.min(b, n)); }
  function gain(key, amount) { state[key] = clamp((state[key] || 0) + amount); }
  function rel(name, amount) { state.relationships[name] = clamp((state.relationships[name] || 0) + amount); }
  function flag(name, value=true) { state.flags[name] = value; }
  function addItem(item) { if (!state.inventory.includes(item)) state.inventory.push(item); }
  function hasItem(item) { return state.inventory.includes(item); }
  function visits(location) { state.visits[location] = (state.visits[location] || 0) + 1; return state.visits[location]; }
  function glitchChance(base) { return Math.random() < base + state.corruption / 500; }

  function esc(s) { return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#39;'}[c])); }
  function renderMenu() {
    const finished = state.endings.length > 0;
    const menuLabel = state.corruption > 60 ? 'YOU ALREADY PLAYED THIS.' : state.corruption > 25 ? 'RESTART' : 'NEW GAME';
    $('menu').innerHTML = `<div class="menu-card">
      <h1 class="title">MY LITTLE PONY:<br>THE LAST SAVE</h1>
      <div class="subtitle">Friendship was never deleted.</div>
      <div class="menu-buttons">
        <button class="menu-btn" data-menu="new">${menuLabel}<span class="small">begin another ordinary day</span></button>
        <button class="menu-btn" data-menu="load">LOAD GAME <span class="small">the saves remember more than you do</span></button>
        <button class="menu-btn" data-menu="gallery">GALLERY <span class="small">${finished ? `${state.endings.length}/6 endings discovered` : 'locked memories'}</span></button>
        <button class="menu-btn" data-menu="settings">SETTINGS <span class="small">audio · video · accessibility</span></button>
        <button class="menu-btn" data-menu="credits">ABOUT <span class="small">a narrative horror experiment</span></button>
        <button class="menu-btn" data-menu="exit">EXIT <span class="small">close window</span></button>
      </div>
      <div class="footer">v1.0.0 · local saves · 18 mini-games · ${state.difficulty}</div>
    </div>`;
    $('menu').querySelectorAll('[data-menu]').forEach(b => b.onclick = () => menuAction(b.dataset.menu));
  }

  function menuAction(action) {
    if (action === 'new') showCharacterSelect();
    if (action === 'load') showLoad();
    if (action === 'settings') showSettings();
    if (action === 'gallery') showGallery();
    if (action === 'credits') showModal('ABOUT', `<p><b>THE LAST SAVE</b> is a self-contained narrative adventure about memory, repetition and the things games ask us to forget.</p><p>No network connection is required. Save data stays in this browser profile.</p><p class="note">Some "errors" are intentional story events.</p>`);
    if (action === 'exit') window.close();
  }

  function showCharacterSelect() {
    showModal('CHOOSE YOUR CHARACTER', `<p>The opening is shared, but your choice changes dialogue, skills and certain puzzles.</p><div class="modal-grid">${Object.entries(characters).map(([id,c]) => `<button class="slot" data-char="${id}"><b style="color:${c.color}">${c.name}</b><br><span class="note">SPECIALTY: ${c.skill}</span></button>`).join('')}</div><p class="note">Later runs remember which character you chose.</p>`);
    document.querySelectorAll('[data-char]').forEach(b => b.onclick = () => { startGame(b.dataset.char); closeModal(); });
  }

  function startGame(id) {
    const old = state;
    state = defaultState();
    state.player = id;
    state.playerName = characters[id].name;
    state.loop = old.loop || 0;
    state.endings = old.endings || [];
    state.difficulty = old.difficulty || 'NORMAL';
    state.corruption = Math.max(0, (old.corruption || 0) - 8);
    state.flags.newGamePlus = old.flags?.newGamePlus || false;
    state.memory = old.memory || 0;
    if (state.flags.newGamePlus) { gain('attention', 15); gain('memory', 10); }
    persist();
    showGame();
    setScene('prologue');
  }

  function showGame() { $('menu').classList.add('hidden'); $('game').classList.remove('hidden'); }
  function showMenu() { $('game').classList.add('hidden'); $('menu').classList.remove('hidden'); renderMenu(); }

  const scenes = {
    prologue: {
      title: 'PROLOGUE — AN ORDINARY DAY', location: 'PONYVILLE',
      text: () => `${welcomeLine()}\n\nThe morning in Ponyville is almost offensively pleasant. Birds sing. Clouds drift. Somewhere, Pinkie Pie is already planning something that absolutely does not require planning.\n\n${state.flags.newGamePlus ? '<span class="warning">You feel like you have done this before.</span>\n' : ''}Your first tasks are simple: visit the library, help a friend, find a lost item, and spend some time near the Everfree Forest. Nothing unusual. Probably.`,
      choices: [
        ['Go to the library', () => libraryIntro()],
        ['Find Pinkie Pie', () => pinkieIntro()],
        ['Help Applejack', () => applejackIntro()],
        ['Visit Fluttershy', () => flutterIntro()]
      ]
    },
    library: { title: 'ACT I — THE LOST BOOK', location: 'GOLDEN OAK LIBRARY' },
    glitch: { title: 'ACT II — THE GLITCH', location: 'GOLDEN OAK LIBRARY · 23:07' },
    echo: { title: 'ACT III — ECHO', location: 'OLD PONYVILLE ARCHIVE' },
    other: { title: 'ACT IV — THE OTHER PONYVILLE', location: 'PONYVILLE // MEMORY COPY' },
    entity: { title: 'ACT V–VI — SHE REMEMBERS', location: 'THE PLACE BETWEEN SAVES' },
    fracture: { title: 'ACT VII — THE FRACTURE', location: 'WORLD CORE' }
  };

  function welcomeLine() {
    const p = characters[state.player];
    return `<span class="quote">${p.name}</span> wakes to sunlight, birdsong and the quiet certainty that this is the first time today has happened.`;
  }

  function setScene(id, customText=null, choices=null) {
    state.scene = id;
    const base = scenes[id] || scenes.prologue;
    $('chapterLabel').textContent = base.title || state.chapter;
    $('locationTitle').textContent = base.location || state.location;
    state.chapter = base.title || state.chapter;
    state.location = base.location || state.location;
    visits(state.location);
    updateHud();
    const text = customText !== null ? customText : (base.text ? base.text() : '');
    $('scene').innerHTML = text;
    const out = choices || (base.choices || []);
    $('choices').innerHTML = out.map((c,i)=>`<button class="choice-btn" data-choice="${i}"><strong>${i+1}.</strong> ${c[0]}</button>`).join('');
    $('choices').querySelectorAll('[data-choice]').forEach((b,i)=>b.onclick=()=>out[i][1]());
    if (state.corruption > 55) document.body.classList.add('corrupted'); else document.body.classList.remove('corrupted');
  }

  function libraryIntro() {
    state.memory += 1; gain('attention', 2); rel('Twilight', 3);
    setScene('library', `<span class="quote">Twilight:</span> “You are exactly who I needed. Could you help me sort a few books?”\n\nYou sort shelves, repair a loose ladder and find a single volume that does not belong. It has no title, no author, and no catalogue number.\n\nOn the cover, a tiny mark looks suspiciously like a blinking cursor.`, [
      ['Touch the book', () => { flag('bookFound'); gain('courage', 2); setScene('library', `<span class="warning">The cover is warm.</span>\n\nThere is a keyhole in the spine. You have no key. Yet you are certain the key will eventually be yours.`, [
        ['Ask Twilight about it', () => { rel('Twilight',5); setScene('prologue', `<span class="quote">Twilight:</span> “I… don't remember ordering that.”\n\nShe laughs, but she keeps looking at the book long after the joke ends.`, [['Continue the normal day', () => pinkieIntro()], ['Stay and investigate', () => findKey()]]); }], ['Leave it alone', () => pinkieIntro()]]); }],
      ['Ignore it and help Twilight', () => { gain('friendship', 3); rel('Twilight',3); pinkieIntro(); }],
      ['Write down the title you cannot see', () => { addItem('Blank Label'); gain('attention',5); findKey(); }]
    ]);
  }

  function findKey() {
    addItem('Old Key'); flag('bookFound'); state.memory += 2;
    setScene('library', `<span class="quote">You find a key behind a book that was not there a minute ago.</span>\n\nThere is no reason it should fit the spine. It does.\n\nWhen the lock clicks, every clock in Ponyville seems to stop for half a second.`, [['Open FRIENDSHIP.EXE', () => openBook()], ['Put the book back', () => { state.corruption += 4; pinkieIntro(); }]]);
  }

  function openBook() {
    flag('bookOpened'); addItem('Fragment of Book'); gain('memory',8); state.corruption += 8;
    setScene('library', `<span class="system">FRIENDSHIP.EXE</span>\n\n<span class="warning">DON'T LET HER REMEMBER.</span>\n\nThe sentence is alone on the page.\n\nTwilight reads it once. Then twice.\n\n<span class="quote">Twilight:</span> “Who is ‘her’?”\n\nA page turns without being touched.`, [['Continue', () => glitchAct()], ['Close the book', () => glitchAct()]]);
  }

  function pinkieIntro() {
    state.memory += 1; rel('Pinkie Pie',3); gain('friendship',3);
    setScene('prologue', `<span class="quote">Pinkie Pie:</span> “Hi! You are here! I knew you would be here! I also knew that you would—”\n\nShe stops.\n\n“...never mind.”\n\nShe gives you a balloon and asks you to play a quick game.`, [
      ['Play tic-tac-toe', () => miniTicTacToe()],
      ['Ask why she stopped', () => { gain('attention',5); rel('Pinkie Pie',7); setScene('prologue', `<span class="quote">Pinkie Pie:</span> “Because I remembered something I wasn't supposed to remember.”\n\nShe smiles immediately.\n\n“Want cake?”`, [['Go get cake', () => applejackIntro()], ['Ask again', () => { state.corruption += 6; glitchAct(); }]]); }],
      ['Continue helping around town', () => applejackIntro()]
    ]);
  }

  function applejackIntro() {
    rel('Applejack',4); gain('friendship',2);
    setScene('prologue', `<span class="quote">Applejack:</span> “Could use a hoof with the harvest.”\n\nThe orchard is peaceful. You collect apples in baskets and race against the clock. One apple is black.\n\nApplejack walks past it without looking.\n\nYou can still smell it.`, [
      ['Pick the black apple', () => { addItem('Black Apple'); gain('attention',7); state.corruption += 3; finishPrologue(); }],
      ['Leave it', () => finishPrologue()],
      ['Ask Applejack about it', () => { rel('Applejack',5); gain('trust',3); finishPrologue(); }],
      ['Play harvest mini-game', () => miniHarvest()]
    ]);
  }

  function flutterIntro() {
    rel('Fluttershy',6); gain('trust',5); gain('friendship',2);
    setScene('prologue', `<span class="quote">Fluttershy:</span> “Would you stay for a little while?”\n\nThe animals are nervous today. Fluttershy keeps checking the door.\n\nShe whispers: “Something keeps walking around the house. I think it is waiting for you.”`, [
      ['Stay', () => { rel('Fluttershy',10); gain('friendship',4); finishPrologue(); }],
      ['Leave', () => { gain('courage',3); state.corruption += 2; finishPrologue(); }],
      ['Ask why', () => { gain('attention',6); state.memory += 3; finishPrologue(); }]
    ]);
  }

  function finishPrologue() {
    if (!state.flags.bookFound) { setScene('prologue', `The day continues. You have not opened the strange book yet.\n\n<span class="note">There will always be another chance.</span>`, [['Go to the library again', () => libraryIntro()], ['Explore the Everfree Forest', () => forestScene()], ['End the day', () => glitchAct()]]); return; }
    glitchAct();
  }

  function glitchAct() {
    state.act = Math.max(state.act, 2); state.corruption += 7; state.memory += 4;
    setScene('glitch', `<span class="system">23:07</span>\n\nThe library is unchanged.\n\nExcept the clock is going backwards.\n\nExcept the books are arranged differently.\n\nExcept there is a door where a bookshelf should be.\n\nYou hear hoofsteps behind you.\n\nNo one enters.`, [
      ['Open the new door', () => alternateLibrary()],
      ['Check the clock', () => { gain('attention',8); addItem('Stopped Clock Hand'); setScene('glitch', `<span class="warning">THE CLOCK IS NOT BROKEN.</span>\n\nIt is waiting.`, [['Continue', () => alternateLibrary()]]); }],
      ['Call for Twilight', () => { rel('Twilight',4); alternateLibrary(); }]
    ]);
  }

  function alternateLibrary() {
    flag('doorSeen'); addItem('Photo'); state.corruption += 6; gain('memory',7);
    setScene('glitch', `The door opens into a second library.\n\nEverything is familiar enough to be wrong.\n\nA photograph lies on a desk. You count six ponies.\n\nYou blink.\n\nSeven.\n\n<span class="warning">You are sure there were six.</span>`, [
      ['Look again', () => { gain('attention',8); setScene('glitch', `The seventh pony has no face.\n\nIt is standing behind you.\n\n<span class="system">PHOTO UPDATED.</span>`, [['Turn around', () => echoAct()], ['Do not turn around', () => echoAct()]]); }],
      ['Take the photo', () => echoAct()],
      ['Go back downstairs', () => echoAct()]
    ]);
  }

  function forestScene() {
    state.location = 'EVERFREE FOREST'; visits(state.location); gain('courage',5); gain('attention',3);
    setScene('prologue', `The Everfree is quiet enough to hear your own heartbeat.\n\nYou find a shard embedded in a tree root. It hums when you hold it.`, [['Take the Element Shard', () => { addItem('Element Shard'); state.memory += 6; glitchAct(); }], ['Leave it', () => finishPrologue()]]);
  }

  function echoAct() {
    state.act = 3; state.corruption += 10; gain('memory',10); state.location = 'OLD PONYVILLE ARCHIVE';
    visits(state.location);
    setScene('echo', `The archive contains save records instead of books.\n\n<span class="system">SAVE_0001</span>\n<span class="system">SAVE_0014</span>\n<span class="system">SAVE_0039</span>\n<span class="system">SAVE_0107</span>\n\nEvery file describes the same week. Every file ends the same way.\n\nSomeone disappears.\n\nSomeone resets the world.`, [
      ['Read SAVE_0001', () => readArchive(1)], ['Read SAVE_0039', () => readArchive(39)], ['Search for your name', () => searchPlayer()], ['Play Memory', () => miniMemory()]
    ]);
  }

  function readArchive(number) {
    gain('attention',5); state.memory += 3;
    const names = number === 1 ? 'TWILIGHT / FLUTTERSHY / PINKIE PIE / APPLEJACK / RARITY / RAINBOW DASH' : 'PLAYER / PLAYER / PLAYER / PLAYER / PLAYER';
    setScene('echo', `<span class="system">SAVE_${String(number).padStart(4,'0')}</span>\n\nPLAYERS: ${names}\nEND CONDITION: <span class="warning">FORGOTTEN</span>\n\nThe strangest part is not that these records exist.\nIt is that one of them contains the exact choice you are about to make.`, [['Follow the record', () => otherPonyville()], ['Ignore it', () => otherPonyville()]]);
  }

  function searchPlayer() {
    state.memory += 8; state.corruption += 8;
    setScene('echo', `<span class="system">SEARCH: ${esc(state.playerName)}</span>\n\nRESULTS: 107\n\n<span class="warning">YOU HAVE BEEN HERE BEFORE.</span>\n\nMost records are corrupted. One is clear.\n\nDATE: UNKNOWN\nCHOICE: “I tried to save them.”`, [['Open the clear file', () => entityAct()], ['Close the archive', () => otherPonyville()]]);
  }

  function otherPonyville() {
    state.act = 4; flag('otherPonyville'); state.corruption += 12; state.location = 'PONYVILLE // MEMORY COPY'; visits(state.location);
    setScene('other', `<span class="warning">PONYVILLE</span>\n\nThe sky is almost black.\nThe houses are perfect.\nNo one is moving.\n\nFluttershy stands in the square.\n\nShe looks at you.\n\n<span class="quote">Fluttershy:</span> “In the last one, you left me here.”`, [
      ['Ask “What last one?”', () => { gain('memory',8); rel('Fluttershy',5); entityAct(); }],
      ['Apologize', () => { gain('friendship',6); rel('Fluttershy',12); entityAct(); }],
      ['Leave the square', () => { gain('courage',7); entityAct(); }],
      ['Play the corrupted maze', () => miniMaze(true)]
    ]);
  }

  function entityAct() {
    flag('entityMet'); state.act = 5; state.corruption += 14; gain('memory',12); state.location = 'THE PLACE BETWEEN SAVES';
    setScene('entity', `<span class="system">SAVE COMPLETE</span>\n\n<span class="warning">WHY DID YOU SAVE HERE?</span>\n\nA voice answers from somewhere outside the screen.\n\n<span class="quote">SHE:</span> “I am not trying to hurt them. I am trying to keep them together.”\n\nThe world has been reset so many times that nobody can remember the first version.\n\nYou are the only thing the system cannot fully erase.`, [
      ['Ask who she is', () => { state.memory += 10; setScene('entity', `<span class="quote">SHE:</span> “The part of Ponyville that remembers.”\n\n“Every time friendship breaks, I restart the day.”\n\n“Every time someone learns the truth, I erase it.”\n\n“And every time you reload, you make me remember more.”`, [['Continue', () => fractureAct()]]); }],
      ['Refuse to believe her', () => { state.corruption += 10; fractureAct(); }],
      ['Ask what happens if the loop stops', () => { gain('attention',10); fractureAct(); }]
    ]);
  }

  function fractureAct() {
    state.act = 7; state.location = 'WORLD CORE'; state.corruption += 15; flag('coreReached');
    setScene('fracture', `<span class="system">WORLD CORE</span>\n\nFour doors surround a save terminal.\n\n<span class="system">WORLD</span> — the town\n<span class="system">CHARACTERS</span> — the memories\n<span class="system">MEMORY</span> — every reset\n<span class="system">PLAYER</span> — <span class="warning">YOU</span>\n\nThe final page of the book is waiting in the slot.`, [
      ['Insert the Last Page', () => { addItem('Last Page'); finalChoice(); }],
      ['Open PLAYER first', () => { gain('memory',10); setScene('fracture', `<span class="system">PLAYER</span>\n\nCHARACTER: ${state.playerName}\nSAVES: ${state.saves}\nLOADS: ${state.loads}\nLOOPS: ${state.loop}\nMEMORY: ${state.memory}%\n\n<span class="warning">THIS DATA IS NOT SUPPOSED TO BE VISIBLE.</span>`, [['Continue to the terminal', () => finalChoice()]]); }]
    ]);
  }

  function finalChoice() {
    let best = state.endings.includes('TRUTH') || state.inventory.length >= 6 || state.memory >= 45;
    const hint = best ? 'The system recognizes that you have read enough to choose.' : 'Something in the terminal hesitates.';
    setScene('fracture', `${hint}\n\n<span class="quote">SHE:</span> “Please. Keep them together.”\n\nThree commands appear.`, [
      ['SAVE THE WORLD', () => endGame('LOOP')],
      ['BREAK THE WORLD', () => endGame('CORRUPTION')],
      ['FREE THEM', () => endGame(best ? 'TRUTH' : 'FORGOTTEN')]
    ]);
  }

  function endGame(kind) {
    const messages = {
      LOOP: `<span class="system">ENDING 02 — LOOP</span>\n\nPonyville resets.\nEveryone is safe.\nEveryone is happy.\n\nPinkie Pie opens her mouth before the title screen fades.\n\n<span class="quote">“You are late this time.”</span>`,
      CORRUPTION: `<span class="warning">ENDING 04 — CORRUPTION</span>\n\nThe save terminal deletes the world one object at a time.\nThe last thing left is the cursor.\nIt blinks three times.\n\n<span class="system">PLAYER: NOT FOUND</span>`,
      FORGOTTEN: `<span class="system">ENDING 03 — FORGOTTEN</span>\n\nYour name disappears from the records.\nThe ponies continue living their ordinary lives.\n\nAt the very bottom of the final save is a sentence:\n\n<span class="warning">SOMEONE WAS HERE.</span>`,
      TRUTH: `<span class="system">ENDING 05 — TRUTH</span>\n\nYou release the memory engine.\nShe dissolves into thousands of forgotten versions of Ponyville.\nFor the first time, the world is allowed to change.\n\nFluttershy looks directly at the screen.\n\n<span class="quote">“Thank you for letting us remember.”</span>`
    };
    if (!state.endings.includes(kind)) state.endings.push(kind);
    state.loop += 1; state.flags.newGamePlus = true; state.endingHint = kind;
    state.corruption = Math.min(100, state.corruption + 9);
    persist();
    setScene('fracture', messages[kind], [['Return to title', () => showMenu()], ['Start New Game+', () => startGame(state.player)]]);
  }

  // ---------- Mini-games ----------
  function launchMini(title, body, cleanup=null) {
    if (currentMiniCleanup) currentMiniCleanup();
    currentMiniCleanup = cleanup;
    $('overlay').classList.remove('hidden');
    $('overlay').innerHTML = `<div class="modal"><button class="close" id="closeMini">✕</button><h2>${title}</h2><div id="miniBody">${body}</div></div>`;
    $('closeMini').onclick = () => { if (currentMiniCleanup) currentMiniCleanup(); currentMiniCleanup=null; $('overlay').classList.add('hidden'); };
  }
  function miniDone(name, reward=3) { state.minigames[name] = (state.minigames[name]||0)+1; gain('friendship',reward); gain('memory',1); persist(); }

  function miniTicTacToe() {
    const board = Array(9).fill(''); let turn='X', over=false;
    const draw=()=> { launchMini('TIC-TAC-TOE', `<p>${state.playerName} vs Pinkie Pie. Pinkie cheats only when losing.</p><div class="mini-board" style="grid-template-columns:repeat(3,1fr)">${board.map((v,i)=>`<button class="tic" data-i="${i}">${v}</button>`).join('')}</div><div id="tttMsg" class="note">Your turn.</div>`); document.querySelectorAll('.tic').forEach(b=>b.onclick=()=>move(+b.dataset.i)); };
    const winner=()=>[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].find(([a,b,c])=>board[a]&&board[a]===board[b]&&board[a]===board[c]);
    function move(i){ if(over||board[i])return; board[i]='X'; if(winner()){ finish('You win. Pinkie stares at the board for exactly one second too long.'); return;} if(board.every(Boolean)){finish('Draw. Pinkie says she remembers winning.');return;} const empty=board.map((v,j)=>!v?j:-1).filter(j=>j>=0); const cheat=state.corruption>30 && Math.random()<.3; const idx=empty[cheat?0:Math.floor(Math.random()*empty.length)]; board[idx]='O'; if(winner()){finish('Pinkie wins. She says she knew that would happen.');return;} draw(); }
    function finish(msg){over=true; miniDone('ticTacToe',4); document.getElementById('miniBody').innerHTML=`<p>${msg}</p><p class="note">The game is saved in your memory.</p><button class="mini-btn" id="miniClose2">Continue</button>`; document.getElementById('miniClose2').onclick=()=>{ $('overlay').classList.add('hidden'); currentMiniCleanup=null; glitchChance(.18)&& (state.corruption+=2); persist(); };}
    draw();
  }

  function miniMemory() {
    const icons=['♥','★','🍎','🪽','♥','★','🍎','🪽'];
    let shuffled=[...icons].sort(()=>Math.random()-.5), open=[], matched=[];
    const render=()=>launchMini('MEMORY', `<p>Find all four pairs. In corrupted mode a card may change after it flips.</p><div class="memory-grid">${shuffled.map((x,i)=>`<button class="mem" data-i="${i}">${matched.includes(i)||open.includes(i)?x:'?'}</button>`).join('')}</div><div id="memMsg" class="note">0 / 4 pairs.</div>` , ()=>{});
    const attach=()=>document.querySelectorAll('.mem').forEach(b=>b.onclick=()=>flip(+b.dataset.i));
    function flip(i){if(open.includes(i)||matched.includes(i))return;open.push(i); if(state.corruption>50&&Math.random()<.15){shuffled[i]=['♥','★','🍎','🪽','?'][Math.floor(Math.random()*5)];} render(); attach(); if(open.length===2){if(shuffled[open[0]]===shuffled[open[1]]) matched.push(...open); setTimeout(()=>{open=[]; render();attach(); if(matched.length===8){miniDone('memory',5);document.getElementById('memMsg').textContent='ALL PAIRS FOUND. Except you could swear one card was different.';}},400);}}
    render(); attach();
  }

  function miniMaze(corrupted=false) {
    const size=6; const player={x:0,y:0}; const goal={x:5,y:5}; const walls=new Set(['1,0','1,1','1,2','3,2','4,2','4,3','2,4','3,4']);
    function draw(){ const cells=[]; for(let y=0;y<size;y++)for(let x=0;x<size;x++){ const key=`${x},${y}`; const cls=key===`${player.x},${player.y}`?'P':key===`${goal.x},${goal.y}`?'G':walls.has(key)?'W':''; cells.push(`<button class="tic" data-m="${x},${y}" style="font-size:14px">${cls||''}</button>`)} launchMini(corrupted?'CORRUPTED MAZE':'LABYRINTH', `<p>${corrupted?'The map changes when you look away.':'Reach the flower at the bottom-right.'}</p><div class="mini-board" style="grid-template-columns:repeat(${size},1fr)">${cells.join('')}</div><div id="mazeMsg" class="note">Arrow keys or click adjacent cells.</div>`); document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>move(+b.dataset.m.split(',')[0],+b.dataset.m.split(',')[1])); }
    function move(x,y){ if(Math.abs(player.x-x)+Math.abs(player.y-y)!==1||walls.has(`${x},${y}`))return;player.x=x;player.y=y;if(corrupted&&Math.random()<.22){const a=[...walls][Math.floor(Math.random()*walls.size)];walls.delete(a);}if(x===5&&y===5){miniDone('maze',4);$('miniBody').innerHTML='<p>You reached the exit. The exit was not on the original map.</p><button class="mini-btn" id="mazeClose">Continue</button>';$('mazeClose').onclick=()=>{$('overlay').classList.add('hidden');currentMiniCleanup=null;persist()};return;}draw();}
    draw();
  }

  function miniHarvest() {
    let score=0,time=12,done=false,timer;
    launchMini('HARVEST', `<p>Click the apples before the timer ends. One wrong apple costs courage.</p><div id="harvestArea" class="runner" style="height:320px"></div><div id="harvestScore" class="note">0 apples · 12s</div>`);
    const area=$('harvestArea');
    function spawn(){if(done)return;area.innerHTML='';for(let i=0;i<6;i++){const b=document.createElement('button');b.className='gem';b.textContent=Math.random()<.12?'●':'🍎';b.style.position='absolute';b.style.left=`${10+Math.random()*75}%`;b.style.top=`${10+Math.random()*70}%`;b.onclick=()=>{if(b.textContent==='●'){gain('courage',-2)}else{score++;b.remove();$('harvestScore').textContent=`${score} apples · ${time}s`}};area.appendChild(b)} }
    spawn(); timer=setInterval(()=>{time--;$('harvestScore').textContent=`${score} apples · ${time}s`;spawn();if(time<=0){clearInterval(timer);done=true;miniDone('harvest',Math.min(5,score));$('harvestScore').textContent=`Finished: ${score} apples.`;}},1000);
    currentMiniCleanup=()=>clearInterval(timer);
  }

  function miniThreeMatch() {
    const colors=['♥','★','🍎','🪽']; let grid=Array.from({length:36},()=>colors[Math.floor(Math.random()*4)]), selected=[];
    const draw=()=>launchMini('THREE IN A ROW', `<p>Click three matching symbols. Find five sets.</p><div class="match-grid">${grid.map((x,i)=>`<button class="gem" data-g="${i}">${x}</button>`).join('')}</div><div class="note">Sets: ${state.minigames.threeMatch||0}</div>`);
    draw(); document.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{selected.push(+b.dataset.g);if(selected.length===3){const vals=selected.map(i=>grid[i]);if(vals.every(v=>v===vals[0])){selected.forEach(i=>grid[i]=colors[Math.floor(Math.random()*4)]);miniDone('threeMatch',2);}else{gain('attention',-1)}selected=[];draw();document.querySelectorAll('[data-g]').forEach(x=>x.onclick=()=>{})}});
  }

  function miniQuiz() {
    const qs=[['What is hidden in the library?','A'],['What changes after repeated saves?','B'],['Who remembers the old cycles?','C']]; let q=qs[Math.min(state.minigames.quiz||0,qs.length-1)];
    launchMini('QUIZ', `<p>${q[0]}</p><div class="quiz-options"><button class="mini-btn" data-q="A">A) A normal book</button><button class="mini-btn" data-q="B">B) Memory</button><button class="mini-btn" data-q="C">C) Everyone</button></div><div class="note">The truth changes depending on what you have seen.</div>`);
    document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{ if(b.dataset.q===q[1]){miniDone('quiz',3);$('miniBody').innerHTML='<p>Correct. The answer feels less correct than it did a moment ago.</p><button class="mini-btn" id="qc">Continue</button>';}else{gain('memory',-2);$('miniBody').innerHTML='<p>Wrong. The question has changed.</p><button class="mini-btn" id="qc">Continue</button>';} $('qc').onclick=()=>{$('overlay').classList.add('hidden');currentMiniCleanup=null;persist();}; });
  }

  function miniReaction() {
    let hits=0, running=true;
    launchMini('REACTION', `<p>Press the shown key before it changes.</p><div id="rx" style="font:42px 'Press Start 2P';text-align:center;padding:50px">SPACE</div><div class="note" id="rxm">0 / 8</div>`);
    const key='Space'; const on=(e)=>{if(!running)return;if(e.code===key){hits++;next();}else{gain('courage',-1)}}; document.addEventListener('keydown',on);
    function next(){if(hits>=8){running=false;document.removeEventListener('keydown',on);miniDone('reaction',4);$('rxm').textContent='COMPLETE';return;}const keys=['Space','Enter','KeyQ','KeyW'];const k=keys[Math.floor(Math.random()*keys.length)];$('rx').textContent=k.replace('Key','');window.__rxKey=k;$('rxm').textContent=`${hits} / 8`;}
    const patch=()=>{const f=(e)=>{if(running&&e.code===window.__rxKey){hits++;next()}};}; next();
    currentMiniCleanup=()=>{running=false;document.removeEventListener('keydown',on)};
  }

  function miniRunner() {
    let x=30, jump=0, score=0, playing=true, raf; const obstacles=[];
    launchMini('RUN', `<p>Space jumps. Survive 15 seconds.</p><div class="runner" id="run"><div class="pony"></div><div class="ground"></div></div><div class="runner-hint" id="runm">0s</div>`);
    const run=$('run'); let last=performance.now(), start=last, vy=0;
    const key=e=>{if(e.code==='Space'&&jump===0)vy=-10}; document.addEventListener('keydown',key);
    function frame(t){if(!playing)return;const dt=Math.min(.032,(t-last)/1000);last=t;if(Math.random()<dt*.9){const h=document.createElement('div');h.className='hazard';h.style.right='-40px';run.appendChild(h);obstacles.push(h)}jump=Math.max(0,jump+vy*dt);vy+=26*dt;if(jump===0&&vy>0)vy=0;document.querySelector('.runner .pony').style.bottom=`${45+jump*3}px`;obstacles.forEach((o,i)=>{let r=parseFloat(o.style.right||'-40');r+=180*dt;o.style.right=`${r}px`;const op=o.getBoundingClientRect(),pp=document.querySelector('.runner .pony').getBoundingClientRect();if(op.left<pp.right&&op.right>pp.left&&op.bottom>pp.top&&op.top<pp.bottom){playing=false;state.corruption+=3;}});score=(t-start)/1000;$('runm').textContent=`${score.toFixed(1)}s`;if(score>=15){playing=false;miniDone('runner',5);$('runm').textContent='ESCAPED';}if(playing)raf=requestAnimationFrame(frame)}
    raf=requestAnimationFrame(frame); currentMiniCleanup=()=>{playing=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',key)};
  }

  function miniCode(){
    const answer='CODE'; launchMini('CODE', `<p>Decode <b>3-15-4-5</b> using A1Z26.</p><div class="quiz-options"><button class="mini-btn" id="c1">CODE</button><button class="mini-btn" id="c2">SAVE</button><button class="mini-btn" id="c3">LOOP</button></div>`);['c1','c2','c3'].forEach(id=>$(id).onclick=()=>{if($(id).textContent===answer)miniDone('code',4);else gain('attention',-2);$('overlay').classList.add('hidden');currentMiniCleanup=null;persist();});
  }

  // ---------- Inventory / saves / UI ----------
  function showInventory(){
    showModal('INVENTORY', state.inventory.length?`<div class="modal-grid">${state.inventory.map((x,i)=>`<div class="item"><b>${esc(x)}</b><div class="note">${itemDesc(x,i)}</div></div>`).join('')}</div>`:'<p>Empty.</p>');
  }
  function itemDesc(x,i){
    const desc={ 'Old Key':'Opens something that did not have a lock yesterday.','Fragment of Book':'A torn page from FRIENDSHIP.EXE.','Photo':state.corruption>25?'Seven ponies. You remember six.':'Six ponies.','Element Shard':'Cold magic. It resonates with the world core.','Black Apple':'It was warm. It is not anymore.','Stopped Clock Hand':'It points to 23:07.','Last Page':'The sentence is always waiting for you.','Blank Label':'The text appears only after you stop looking at it.'}; return desc[x]||`Unknown item #${i+1}`;
  }
  function saveGame(slot=1){
    state.saves++;state.lastSaveLocation=state.location;state.memory+=1;state.corruption+=(state.loads>3?1:0);localStorage.setItem(`${STORAGE}-slot-${slot}`,JSON.stringify(state));persist();
    const message=state.corruption>45?'MEMORY SAVED.':'GAME SAVED.'; setScene(state.scene, `${$('scene').innerHTML}\n\n<span class="system">${message}</span>${state.corruption>58?'\n<span class="warning">WHY DID YOU SAVE HERE?</span>':''}`); }
  function loadGame(slot=1){
    const raw=localStorage.getItem(`${STORAGE}-slot-${slot}`); if(!raw){showModal('LOAD GAME','<p>No data in this slot.</p>');return;} try{state=JSON.parse(raw);state.loads=(state.loads||0)+1;state.memory=(state.memory||0)+2;state.corruption=Math.min(100,(state.corruption||0)+Math.min(10,state.loads));persist();showGame();setScene(state.scene||'prologue', `${state.loads>1?'<span class="warning">You loaded this day again.</span>\n\n':''}<span class="system">LAST LOCATION: ${esc(state.lastSaveLocation||'???')}</span>\n\nThe world resumes exactly where you left it.\n\n<span class="quote">“I told you not to load that.”</span>`, [[`Continue from ${esc(state.lastSaveLocation||'the save')}`,()=>resumeAfterLoad()]]);}catch{showModal('LOAD ERROR','<p>The save is damaged.</p>');}}
  function resumeAfterLoad(){closeModal(); if(state.act>=7)fractureAct(); else if(state.act>=5)entityAct();else if(state.act>=4)otherPonyville();else if(state.act>=3)echoAct();else glitchAct();}
  function showLoad(){showModal('LOAD GAME',`<div class="modal-grid">${[1,2,3].map(i=>{const raw=localStorage.getItem(`${STORAGE}-slot-${i}`);let s;try{s=raw?JSON.parse(raw):null}catch{};return `<button class="slot ${s?'used':''}" data-slot="${i}"><b>SAVE ${String(i).padStart(2,'0')}</b><br><span class="note">${s?`LAST LOCATION: ${esc(s.lastSaveLocation||'???')}<br>STATUS: ${s.corruption>40?'CORRUPTED':'NORMAL'}`:'EMPTY SLOT'}</span></button>`}).join('')}</div>`);document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{loadGame(+b.dataset.slot);closeModal();});}
  function showSettings(){showModal('SETTINGS',`<div class="modal-grid"><div class="slot"><b>AUDIO</b><p>Music: ${state.settings.music?'ON':'OFF'}</p><p>SFX: ${state.settings.sfx?'ON':'OFF'}</p><button class="mini-btn" id="toggleAudio">Toggle music</button></div><div class="slot"><b>ACCESSIBILITY</b><p>Text speed: ${state.settings.textSpeed}x</p><p>Screen shake: ${state.settings.shake?'ON':'OFF'}</p><button class="mini-btn" id="toggleShake">Toggle shake</button></div><div class="slot"><b>VIDEO</b><p>Fullscreen is handled by your window manager.</p><p>Effects are part of the horror presentation.</p></div><div class="slot"><b>DIFFICULTY</b><p>Current: ${state.difficulty}</p><button class="mini-btn" id="difficulty">Cycle difficulty</button></div></div>`);$('toggleAudio').onclick=()=>{state.settings.music=!state.settings.music;showSettings()};$('toggleShake').onclick=()=>{state.settings.shake=!state.settings.shake;showSettings()};$('difficulty').onclick=()=>{const d=['FRIENDLY','NORMAL','NIGHTMARE','CORRUPTED','???'];state.difficulty=d[(d.indexOf(state.difficulty)+1)%d.length];state.corruption+=state.difficulty==='CORRUPTED'?5:0;showSettings();persist()};}
  function showGallery(){const unlock=state.endings.length;showModal('GALLERY',`<div class="modal-grid"><div class="doc"><b>CHARACTERS</b><div class="note">${state.playerName||'Not selected'} unlocked</div></div><div class="doc"><b>DOCUMENTS</b><div class="note">${hasItem('Fragment of Book')?'FRIENDSHIP.EXE fragment':'???'}</div></div><div class="doc"><b>PHOTOS</b><div class="note">${hasItem('Photo')?'Memory Photo':'???'}</div></div><div class="doc"><b>ENDINGS</b><div class="note">${unlock}/6 found</div></div></div><p class="note">Collect every item, clear every mini-game and discover every secret to unlock ENDING 06 — ???.</p>`);}
  function showModal(title,body){$('overlay').classList.remove('hidden');$('overlay').innerHTML=`<div class="modal"><button class="close" id="modalClose">✕</button><h2>${title}</h2>${body}</div>`;$('modalClose').onclick=closeModal;}
  function closeModal(){$('overlay').classList.add('hidden');$('overlay').innerHTML='';currentMiniCleanup=null;}

  function updateHud(){
    $('portrait').style.filter=state.corruption>65?'contrast(1.25) saturate(.55)':'none';
    $('playerName').textContent=characters[state.player]?.name||'UNKNOWN';
    $('stats').innerHTML=[['FRIENDSHIP',state.friendship],['COURAGE',state.courage],['ATTENTION',state.attention],['TRUST',state.trust],['MEMORY',clamp(state.memory)].map(x=>`<div class="stat"><b><span>${x[0]}</span><span>${x[1]}</span></b><div class="bar"><i style="width:${clamp(x[1])}%"></i></div></div>`).join('');
    $('relationships').innerHTML=npcNames.map(n=>`<div class="rel"><b><span>${n}</span><span>${state.relationships[n]}%</span></b><div class="bar"><i style="width:${state.relationships[n]}%"></i></div></div>`).join('');
    $('clockLabel').textContent=state.corruption>45?'23:07':'09:14';
  }

  document.addEventListener('click', (e) => {
    const a=e.target.closest('[data-action]'); if(!a)return; const action=a.dataset.action;
    if(action==='save')showSavePanel();
    if(action==='inventory')showInventory();
    if(action==='menu'){persist();showMenu();}
  });
  function showSavePanel(){showModal('SAVE GAME',`<div class="modal-grid">${[1,2,3].map(i=>`<button class="slot" data-save="${i}"><b>SAVE ${String(i).padStart(2,'0')}</b><br><span class="note">Current: ${esc(state.location)}</span></button>`).join('')}</div><p class="note">Some saves may acquire properties you did not put there.</p>`);document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{saveGame(+b.dataset.save);closeModal();});}

  // extra mini-games bound to story milestones
  window.PONY_GAME = { miniThreeMatch, miniQuiz, miniReaction, miniRunner, miniCode, miniMaze };

  function boot(){
    recover();
    let progress=0; const t=setInterval(()=>{progress+=12; $('bootBar').style.width=`${Math.min(progress,100)}%`; const lines=['initializing friendship memory...','loading Ponyville...','restoring character data...','checking previous saves...','warning: memory mismatch','ready.'];$('bootLine').textContent=lines[Math.min(lines.length-1,Math.floor(progress/20))];if(progress>=100){clearInterval(t);setTimeout(()=>{$('boot').classList.add('hidden');$('app').classList.remove('hidden');renderMenu();},350)}},120);
  }
  boot();
})();
