# SignalBridge Classroom - Devpost Paste Pack

## Project name

SignalBridge Classroom

## Elevator pitch

An education support signal that learns the learner, not a generic emotion label.

## Built with

Vanilla JavaScript, Web Audio API, localStorage, Python, PyTorch, Hugging Face Transformers, scikit-learn, GitHub Pages

## Links

- Source: https://github.com/xqscora/signalbridge-classroom
- Demo: https://xqscora.github.io/signalbridge-classroom/?demo=1
- Cover: `assets/signalbridge-cover.png`

## Inspiration

Students do not all express cognitive load in the same way. A student may be ready to continue, need a pause, or be unsure, but a generic classifier can turn those differences into a confident wrong label. In a classroom, the cost is not just accuracy: the wrong support arrives at the wrong time.

SignalBridge started from Cora's existing Heard/Cerome work on per-person calibration and honest uncertainty. The important shift was to stop asking a model to name a private emotion and instead let the learner define the support states that matter to them.

## What it does

SignalBridge analyzes a short voice check-in locally and returns one of three learner-defined states: Keep going, Please pause, or Ask me. The teacher view exposes a suggested next move, never a private recording or a diagnosis. Every result can be confirmed or corrected, and only aggregate features plus the correction update the learner-specific model in the browser.

When the top two states are too close or confidence is too low, the model abstains and returns Ask me. That is a deliberate product behavior: asking the learner is safer than pretending to know.

## How we built it

The browser path extracts five normalized acoustic features and compares them with weighted support-state centroids. Scores are normalized, then filtered by both confidence and top-two margin. A confirmation or correction updates one learner centroid with an online mean, creating a small, inspectable personalization loop.

The repository also contains the compact trained wav2vec2 + LogisticRegression model from the original Heard experiment and `model_adapter.py`. That optional local path supplies a research prior before the support-state layer. Its RAVDESS source is generic adult speech, so it is explicitly not treated as a clinical or autism-specific classifier.

## What we learned

The base experiment measured a 64% speaker-independent generic result rising to 75% with three samples per emotion. The product lesson is more important than the number: adaptation must belong to the learner, and the system must expose uncertainty instead of hiding it behind a score.

## Challenges

The hardest design decision was refusing to make the project sound more certain than its data. We kept the real model limitation visible, changed the output to learner-defined support rather than emotion, and made the human correction path part of the algorithm rather than an afterthought.

## What's next

An early school pilot would evaluate reduction in unnecessary interruptions, time-to-support after a student asks for help, and correction rate by learner. The next model stage would use consented classroom data with per-learner calibration and subgroup audits before any hosted deployment. Raw recordings would remain opt-in and separately governed.

## AI use disclosure

AI coding assistance was used for brainstorming, implementation drafting, and debugging. The project owner reviewed the implementation and remains responsible for understanding and explaining the code. The speech model artifact and experiment were developed from the public-data research package described in the repository.

## Two-minute demo script

**0:00-0:20 - Problem**

"A classroom does not need another system that claims to know a student's emotion. It needs a way to respond to the student's own signal. The same voice pattern can mean different things for different learners."

**0:20-0:55 - Live signal**

Click `Please pause`. Show the confidence, model receipt, and the teacher move. Then click `I'm not sure` and show that the system returns `Ask me` instead of forcing a label.

**0:55-1:25 - Personalization**

Click `Correct: pause`. Show the learner model changing from zero to one confirmed sample. Explain that the correction updates only one learner centroid in local browser storage.

**1:25-1:45 - Technical core**

Show the receipt: weighted feature distance, top probability, top-two margin, and abstention rule. Mention that the repository also includes the real local wav2vec2 adapter from the Heard experiment.

**1:45-2:00 - Boundary and impact**

"The teacher sees a next move, not a diagnosis. The learner can correct every read. Our goal is fewer wrong interruptions and faster support, while keeping raw voice data local."
