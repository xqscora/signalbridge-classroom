# QA checklist

## Static checks

```powershell
node --check app.js
python -m http.server 8787
```

## Browser smoke path

1. Open `/?demo=1` and confirm the pause state, confidence meter, model receipt, and teacher move render.
2. Click `Correct: pause`; confirm the learner model shows one sample and the local history shows a correction.
3. Click `I'm not sure`; confirm the state is `Ask me` and the receipt explains the close/uncertain path.
4. Change the `Please pause` student-owned protocol to `Give a quiet pause`; confirm the teacher suggestion changes immediately.
5. Click `It helped`; confirm the local outcome evidence changes to `1/1` and the history records the action.
6. Click `Reset demo`; confirm counters, protocol choices, and the current readout return to their empty state.
7. On a permissioned HTTPS/localhost origin, click `Record 3 seconds`; confirm the microphone path ends in a readout and no raw audio file is created.
