# CosyVoice Integration

The dialogue editor can request speech from a local CosyVoice FastAPI server and save the generated WAV file into the project.

## Run CosyVoice

```sh
docker compose -f docker-compose.cosyvoice.yml up --build
```

The server listens on `http://localhost:50000` by default. The first run downloads the selected model into Docker volumes.

Useful environment overrides:

```sh
COSYVOICE_MODEL_DIR=iic/CosyVoice-300M-Instruct docker compose -f docker-compose.cosyvoice.yml up --build
COSYVOICE_HOST_PORT=50001 docker compose -f docker-compose.cosyvoice.yml up --build
COSYVOICE_REF=<git-tag-or-commit> docker compose -f docker-compose.cosyvoice.yml build
```

## Platform Notes

This compose file uses the official CUDA/PyTorch deployment path, so it is meant for Windows with WSL2 + NVIDIA GPU or Linux + NVIDIA GPU.

Docker improves reproducibility, but it does not make GPU support identical across operating systems. Docker Desktop on macOS does not expose Apple Silicon GPU as CUDA, so a Mac usually needs one of these paths:

- point the editor at a CosyVoice server running on a Windows/Linux GPU machine
- use a custom CPU-only CosyVoice image, accepting much slower generation
- generate audio on the Windows machine and commit the generated WAV files

## Character Voice Settings

Add CosyVoice settings to a character JSON through the character editor `voice` field.

Simple SFT example:

```json
{
  "provider": "cosyvoice",
  "endpoint": "http://localhost:50000",
  "mode": "sft",
  "spk_id": "中文女",
  "sample_rate": 22050
}
```

Zero-shot example:

```json
{
  "provider": "cosyvoice",
  "endpoint": "http://localhost:50000",
  "mode": "zero_shot",
  "prompt_text": "이 목소리의 기준 문장입니다.",
  "prompt_wav": "assets/voices/prompts/arin.wav",
  "sample_rate": 22050
}
```

Supported modes are `sft`, `zero_shot`, `cross_lingual`, `instruct`, and `instruct2`.

## Editor Output

Generated files are saved under:

```text
assets/voices/<dialogue_id>/<node_id>_<speaker_id>_<mode>.wav
```

The dialogue node stores the runtime path in metadata:

```json
{
  "metadata": {
    "voice_audio": "res://assets/voices/chapter_001_intro/1_arin_sft.wav"
  }
}
```

Godot plays `metadata.voice_audio` when the node starts. If the editor is opened through plain HTTP mode, the audio file is downloaded instead of written directly; place it at the shown project path before running the game.
