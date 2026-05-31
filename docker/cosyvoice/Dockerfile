FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /opt/CosyVoice

ARG COSYVOICE_REPO=https://github.com/FunAudioLLM/CosyVoice.git
ARG COSYVOICE_REF=main

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    git \
    git-lfs \
    g++ \
    libsox-dev \
    sox \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN python -m pip install --no-cache-dir --upgrade "pip<25.1" "setuptools<81" wheel \
  && printf "setuptools<81\n" > /tmp/pip-build-constraints.txt

ENV PIP_CONSTRAINT=/tmp/pip-build-constraints.txt

RUN git lfs install \
  && git clone --recursive "${COSYVOICE_REPO}" CosyVoice \
  && cd CosyVoice \
  && git checkout "${COSYVOICE_REF}" \
  && git submodule update --init --recursive \
  && pip install --no-cache-dir -r requirements.txt

RUN pip uninstall --yes deepspeed

ENV COSYVOICE_PORT=50000
ENV COSYVOICE_MODEL_DIR=iic/CosyVoice-300M-SFT

EXPOSE 50000

CMD ["/bin/bash", "-lc", "cd /opt/CosyVoice/CosyVoice/runtime/python/fastapi && python3 server.py --port ${COSYVOICE_PORT} --model_dir ${COSYVOICE_MODEL_DIR}"]
