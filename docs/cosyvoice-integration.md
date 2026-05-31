# CosyVoice Integration

The dialogue editor can request speech from a local CosyVoice FastAPI server and save the generated WAV file into the project. There are two supported local paths:

- Set a character `voice.provider` to `cosyvoice` and leave the editor's "Local TTS URL" empty. The editor calls the CosyVoice FastAPI endpoints directly.
- Run the local JSON proxy in this repository and set "Local TTS URL" to `http://localhost:7860/tts`. The editor sends its generic local TTS payload, and the proxy converts it to CosyVoice multipart requests.

## Run CosyVoice Backend

```sh
docker compose -f docker-compose.cosyvoice.yml up --build
```

The server listens on `http://localhost:50000` by default. The first run downloads the selected model into Docker volumes.

The default model is `iic/CosyVoice-300M-SFT` because the editor defaults to `sft` mode. Use a model that matches the mode you want:

| Mode | Suggested model |
| --- | --- |
| `sft` | `iic/CosyVoice-300M-SFT` |
| `zero_shot`, `cross_lingual` | `iic/CosyVoice-300M` or `iic/CosyVoice2-0.5B` |
| `instruct` | `iic/CosyVoice-300M-Instruct` |
| `instruct2` | `iic/CosyVoice2-0.5B` |

Useful environment overrides:

```sh
COSYVOICE_MODEL_DIR=iic/CosyVoice-300M docker compose -f docker-compose.cosyvoice.yml up --build
COSYVOICE_MODEL_DIR=iic/CosyVoice-300M-Instruct docker compose -f docker-compose.cosyvoice.yml up --build
COSYVOICE_HOST_PORT=50001 docker compose -f docker-compose.cosyvoice.yml up --build
COSYVOICE_REF=<git-tag-or-commit> docker compose -f docker-compose.cosyvoice.yml build
```

## Run Local TTS Proxy

On Windows, you can double-click the helper script from the project root:

```text
run_cosyvoice_local.bat
```

It starts Docker Compose in the background and keeps the TTS proxy open in the command window. To stop the Docker backend later, run:

```text
stop_cosyvoice_local.bat
```

Use the proxy when you want the dialogue editor's generic local TTS URL to drive CosyVoice:

```sh
python tools/cosyvoice_tts_proxy.py --cosyvoice-url http://localhost:50000
```

Then open `tools/dialogue_editor.html`, connect the project folder, and set:

```text
Local TTS URL: http://localhost:7860/tts
```

The proxy accepts the editor payload:

```json
{
  "text": "안녕하세요.",
  "speaker": "235db733-cbb2-4c89-86fc-377149f9de48",
  "voice": {
    "provider": "cosyvoice",
    "mode": "sft",
    "spk_id": "韩语女"
  }
}
```

It returns `audio/wav`, so the editor can save the result under `assets/voices/...` and write `metadata.voice_audio`.
For Korean or Japanese text, the proxy automatically adds the matching CosyVoice language token before forwarding the request.

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
  "spk_id": "韩语女",
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
  "prompt_wav": "assets/voices/prompts/235db733-cbb2-4c89-86fc-377149f9de48.wav",
  "sample_rate": 22050
}
```

Supported modes are `sft`, `zero_shot`, `cross_lingual`, `instruct`, and `instruct2`.

The proxy also accepts `preset`, `voice`, or `speaker` as a fallback for `spk_id`, so the character editor's "local voice key" field can be used for simple SFT voices.

## Editor Output

Generated files are saved under:

```text
assets/voices/<dialogue_id>/<node_id>_<speaker_id>_<mode>.wav
```

The dialogue node stores the runtime path in metadata:

```json
{
  "metadata": {
    "voice_audio": "res://assets/voices/f52b0b1d-9c28-453d-8ce2-50290e50a79d/1_235db733-cbb2-4c89-86fc-377149f9de48_sft.wav"
  }
}
```

Godot plays `metadata.voice_audio` when the node starts. If the editor is opened through plain HTTP mode, the audio file is downloaded instead of written directly; place it at the shown project path before running the game.
