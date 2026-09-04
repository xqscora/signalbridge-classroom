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
4. Click `Reset demo`; confirm counters and the current readout return to their empty state.
5. On a permissioned HTTPS/localhost origin, click `Record 3 seconds`; confirm the microphone path ends in a readout and no raw audio file is created.
