# MY LITTLE PONY: THE LAST SAVE

### `Friendship was never deleted.`

A standalone Electron horror adventure built around a deliberately friendly opening that slowly turns into a story about memory, save files and a world that keeps restarting itself.

## Included

- Six playable starting characters with different specialties.
- Seven-act narrative structure with branching decisions.
- Persistent stats: Friendship, Courage, Attention, Trust and hidden Memory.
- Individual relationship values for the six main ponies.
- Persistent save/load slots and save history used as story mechanics.
- Inventory with items whose descriptions can change as corruption rises.
- Ponyville, Everfree Forest, memory-copy Ponyville, archive and World Core locations.
- 18 playable mini-games: Tic-Tac-Toe, Three-in-a-Row, Memory, Labyrinth, Search, Rhythm, Card Duel, Runner, Switches, Cipher, Delivery, Fishing, Differences, Quiz, Reaction, Harvest, Flight and Magic Pattern.
- Five visible difficulty presets plus hidden `???` mode.
- Six-ending framework including the secret `ENDING 06 — ???` route.
- New Game+ that carries memories of previous runs.
- False error messages, time anomalies, altered photographs and fourth-wall dialogue.
- Windows portable `.exe` build through GitHub Actions.

## Run locally

```bash
npm install
npm start
```

## Checks

```bash
npm run check
npm run lint
```

## Build Windows EXE

```bash
npm run dist
```

The GitHub Actions workflow also produces `THE-LAST-SAVE-Windows` as a downloadable build artifact on pushes to `main`.

## Design direction

The game intentionally keeps most of its tension in the gap between normal and abnormal. The horror escalates through inconsistency, memory, save/load behavior, changing text and spaces that are almost—but not quite—the same place.
