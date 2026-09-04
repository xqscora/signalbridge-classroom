# SignalBridge Classroom

SignalBridge is an education-first adaptation of Cora's existing Heard/Cerome work. It does not ask a generic emotion classifier to define a student. Instead, it learns a small, student-owned mapping from voice features to three support states:

- Keep going
- Please pause
- Ask me

The browser prototype extracts compact acoustic features locally, compares them with weighted support-state centroids, abstains when confidence or separation is low, and updates a learner-specific centroid only after a student or teacher confirms/corrects the read. No raw audio is stored or uploaded.

## Why this is a real adaptation

The USAII project established the research spine: speaker-independent speech modeling, per-person calibration, honest uncertainty, and human confirmation. SignalBridge changes the product and the task for an education/ML competition:

| Heard / USAII | SignalBridge Classroom |
| --- | --- |
| Emotion recognition for community support | Classroom support-state communication |
| Generic emotion labels | Student-defined actionable states |
| Research/demo notebook | Browser workflow for learner, teacher, and correction |
| Per-child calibration as an experiment | Online local centroid memory as the product loop |

The result is not a clinical tool and does not infer diagnosis, intent, or inner feeling.

## Run locally

```powershell
python -m http.server 8787
```

Open `http://127.0.0.1:8787/?demo=1`. Sample phrases exercise the model without microphone permission. The Record button uses `getUserMedia`, keeps only aggregate feature vectors, and stops after three seconds.

## Technical core

The model is deliberately inspectable: five normalized acoustic features, weighted Euclidean distance to three centroids, softmax-like similarity scores, a confidence threshold, and a top-two margin threshold. A correction updates only the selected learner profile using an online mean. This gives a judge an end-to-end ML loop they can test in under two minutes.

The existing USAII experiment remains the empirical foundation for why personalization matters: its RAVDESS speaker-independent baseline is 64%, rising to 75% after three samples per emotion. The public competition demo uses support-state labels rather than claiming the RAVDESS model is a classroom-ready autism detector.

## Product and market boundary

The first customer is a school learning-support team that needs a low-friction way to honor a student's communication preferences during transitions, group work, or high-load tasks. The privacy posture is designed for a pilot: local-first storage, student-visible corrections, no raw media retention, no diagnostic labels, and an explicit human decision layer.

## Files

- `index.html`: student check-in, learner model, teacher view, and evidence surface
- `app.js`: feature extraction, classifier, abstention policy, online personalization, and local memory
- `styles.css`: responsive product UI
- `SUBMISSION.md`: competition-facing story and disclosure
- `QA.md`: repeatable smoke checks
- `assets/personalization_curve.png`: evidence figure from the base project
