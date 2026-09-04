# SignalBridge Classroom - Competition Draft

## Tagline

An education support signal that learns the learner, not a generic emotion label.

## Short pitch

Students do not all express load, readiness, or uncertainty in the same way. SignalBridge Classroom learns a student-defined mapping from local voice features to three actionable support states: keep going, please pause, or ask me. It abstains when the evidence is close, lets the learner correct every read, and shows teachers a next move without storing raw recordings or making a diagnosis.

## What is technically different

The prototype combines five pieces in one testable loop:

1. Local acoustic feature extraction from a microphone or a reproducible sample phrase.
2. Weighted centroid classification across three student-owned support states.
3. Confidence plus top-two margin abstention, so a close decision becomes Ask me.
4. Online per-learner adaptation after confirmation or correction.
5. A model receipt and teacher view that expose evidence and preserve human control.

## Why this is based on original work

The project adapts Cora Zeng's existing Heard/Cerome research package. That work measured the value of per-person calibration on speaker-independent RAVDESS data: a 64% generic baseline improved to 75% after three samples per emotion. SignalBridge turns that research question into a different education product and changes the output from emotion to a learner-defined support state.

## How it was built

The public demo is vanilla HTML/CSS/JavaScript so the full inference loop is inspectable in the browser. The model stores only aggregate feature vectors and counts in localStorage. The evidence panel links the adaptation to the existing trained-model experiment; it does not pretend that a small prototype is clinically validated.

## Responsible AI disclosure

This is a prototype for educational support, not a medical or diagnostic system. It must not be used to label autistic people or infer private feelings. The learner can choose and correct support meanings; the teacher confirms before acting. No raw audio is uploaded or retained by the prototype. The original speech-emotion baseline used public RAVDESS data and has known domain limitations; SignalBridge makes no claim that those labels transfer directly to autistic students.

## Demo path

1. Click `Please pause` to see a clear model receipt and teacher next move.
2. Click `Correct: pause` to add one learner-specific sample.
3. Try `I'm not sure`, then click `That was right` to show the abstention path and local memory.
4. Click `Record 3 seconds` to run the same feature pipeline on microphone input, if permission is available.
