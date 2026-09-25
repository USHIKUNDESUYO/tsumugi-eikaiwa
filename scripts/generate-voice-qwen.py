#!/usr/bin/env python3
"""
紬の声（Qwen3-TTS「元気」）で、セリフを事前に音声化する。

    npx tsx scripts/export-voice-lines.ts          # セリフの一覧を書き出す
    python scripts/generate-voice-qwen.py          # 未生成・文言が変わったものだけ作る
    python scripts/generate-voice-qwen.py --force  # 全部作り直す
    python scripts/generate-voice-qwen.py --only greet-1-0 35ee4bbc9737
    python scripts/generate-voice-qwen.py --out-root /tmp/stage  # 別の場所に作って、聞いてから差し替える

声の元:
    scripts/voice/tsumugi-ref.wav
        2026-09-24 に候補を聞き比べて選んだ「元気」の声そのもの（6秒）。
        Qwen3-TTS-12Hz-1.7B-VoiceDesign に次の説明を与えて作った（seed 7）:
          "A young adult woman with a bright, bubbly, high-pitched anime-heroine
           voice. Energetic, adorable and cheerful, like a Japanese idol or anime
           heroine. Very cute moe style."
        ボイスデザインは生成のたびに少しずつ別人になる（同じ説明で作った日本語は
        別の声だった）ので、この1本を「紬の声」と決めて、全セリフをこれに寄せる。
    scripts/voice/tsumugi-ref-long.wav
        上の1本に、同じ声で読んだ英文2本（話者照合で 0.93 / 0.955）をつないだ13秒。
        声のクローンの手本にはこちらを使う。6秒だけより日本語が元の声に寄った
        （話者照合で 0.86 → 0.89 前後）。

品質チェック（1本ごと）:
    - Whisper で書き起こして原文と比べる（言い間違い・抜け）
    - 長さが話す速さとして自然か（無音・途切れ・間延び）
    - WavLM の話者照合で、選んだ声（tsumugi-ref.wav）にどれだけ近いか
    どれかが基準を下回ったら種を変えて作り直し、3回作って一番よいものを残す。
    それでも基準に届かなかったものは最後に「要確認」として並べる。

速さ:
    4本ずつまとめて作る（CPU で1本あたり約12〜20秒。1本ずつだと約35秒）。

必要なもの:
    pip install -r scripts/requirements-voice.txt
    GPU は要らない。モデルのライセンスは Apache-2.0。
"""
import argparse
import hashlib
import json
import os
import re
import sys
import time
from difflib import SequenceMatcher
from pathlib import Path

import lameenc
import librosa
import numpy as np
import pykakasi
import torch
from qwen_tts import Qwen3TTSModel
from transformers import AutoFeatureExtractor, WavLMForXVector, pipeline

ROOT = Path(__file__).resolve().parent.parent
LINES = ROOT / "scripts/voice/lines.json"
STAMPS = ROOT / "scripts/voice/generated.json"
QA = ROOT / "scripts/voice/qa.json"
ANCHOR = ROOT / "scripts/voice/tsumugi-ref.wav"
REF = ROOT / "scripts/voice/tsumugi-ref-long.wav"
REF_TEXT = (
    "Hi! Nice to meet you. Is this your first time at Synapse? I'm so happy you came! "
    "Sorry, could you say that one more time? The music is really loud over here. "
    "Is there anywhere I can leave my luggage?"
)
# 声や手本を変えたらここを上げる。記録と食い違ったファイルは作り直しになる。
VOICE_VERSION = "qwen3-genki-v1"
MP3_KBPS = 64
ATTEMPTS = 3
BATCH = 4
PASS_TEXT = 0.85  # 書き起こしと原文の一致
PASS_SPEAKER = 0.85  # 選んだ声との話者照合（同一人物は 0.90 前後、別人は 0.77〜0.85 だった）
CODEC_HZ = 12  # 1秒 = 12 ステップ

kks = pykakasi.kakasi()


def stamp_of(line):
    key = f"{VOICE_VERSION}\n{line['lang']}\n{line['text']}"
    return hashlib.sha1(key.encode()).hexdigest()[:16]


def normalize(text, lang):
    """書き起こしと原文を比べられる形にする（和文はひらがなの読みに揃える）"""
    if lang == "ja":
        reading = "".join(item["hira"] for item in kks.convert(text))
        return re.sub(r"[^ぁ-ゖー]", "", reading)
    return " ".join(re.sub(r"[^a-z0-9' ]", " ", text.lower()).split())


def text_match(a, b, lang):
    x, y = normalize(a, lang), normalize(b, lang)
    if lang == "en":
        x, y = x.split(), y.split()
    return SequenceMatcher(None, x, y).ratio()


def duration_ok(seconds, text, lang):
    """極端に短い（無音・途切れ）/ 長い（間延び・繰り返し）ものをはじく"""
    n = len(normalize(text, lang))
    per_sec = n / max(seconds, 0.01)
    # 和文はかな、英文は文字で数える。どちらも普通に話す速さのかなり外側で切る。
    low, high = (2.5, 14) if lang == "ja" else (5, 25)
    return low <= per_sec <= high


def max_steps(lines):
    """
    生成の上限。モデルの既定は 8192 ステップ（11分超）で、まとめて作ると
    止まらない1本に全員が付き合わされる。ゆっくり話した長さの2.5倍に抑える。
    """
    seconds = [len(l["text"]) / (7 if l["lang"] == "ja" else 14) * 2.5 + 2 for l in lines]
    return int(max(seconds) * CODEC_HZ)


def to_mp3(wav, sr):
    pcm = (np.clip(wav, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(MP3_KBPS)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm.tobytes()) + enc.flush()


class Judge:
    """書き起こし（Whisper）と話者照合（WavLM）で1本を採点する"""

    def __init__(self):
        self.asr = pipeline("automatic-speech-recognition", model="openai/whisper-small", device="cpu")
        self.fe = AutoFeatureExtractor.from_pretrained("microsoft/wavlm-base-plus-sv")
        self.sv = WavLMForXVector.from_pretrained("microsoft/wavlm-base-plus-sv").eval()
        anchor, _ = librosa.load(str(ANCHOR), sr=16000, mono=True)
        self.anchor = self._embed(anchor)

    def _embed(self, wav16k):
        inputs = self.fe([wav16k], sampling_rate=16000, return_tensors="pt", padding=True)
        with torch.no_grad():
            return torch.nn.functional.normalize(self.sv(**inputs).embeddings[0], dim=-1)

    def score(self, wav, sr, line):
        wav16k = librosa.resample(wav, orig_sr=sr, target_sr=16000)
        lang = line["lang"]
        heard = self.asr(
            {"raw": wav16k, "sampling_rate": 16000},
            generate_kwargs={"language": "japanese" if lang == "ja" else "english", "task": "transcribe"},
        )["text"].strip()
        seconds = len(wav) / sr
        text = text_match(line["text"], heard, lang)
        speaker = float(torch.dot(self.anchor, self._embed(wav16k)))
        passed = text >= PASS_TEXT and speaker >= PASS_SPEAKER and duration_ok(seconds, line["text"], lang)
        # 合格したものの中では声が近いほどよい。不合格どうしなら一致度と声の近さの両方を見る。
        rank = (passed, speaker if passed else text + speaker)
        return {"heard": heard, "seconds": seconds, "text": text, "speaker": speaker, "passed": passed, "rank": rank}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="記録に関係なく全部作り直す")
    ap.add_argument("--only", nargs="*", help="このIDだけ作る")
    ap.add_argument("--out-root", help="音声と記録をこのディレクトリの下に書く（既定はリポジトリ）")
    args = ap.parse_args()

    # 音声・記録の書き先。リポジトリと同じ相対パスで置く。
    out_root = Path(args.out_root).resolve() if args.out_root else ROOT
    stamps_path = out_root / STAMPS.relative_to(ROOT)
    qa_path = out_root / QA.relative_to(ROOT)
    stamps_path.parent.mkdir(parents=True, exist_ok=True)

    lines = json.loads(LINES.read_text())["lines"]
    stamps = json.loads(stamps_path.read_text()) if stamps_path.exists() else {}
    todo = [
        l for l in lines
        if (not args.only or l["id"] in args.only)
        and (args.force or stamps.get(l["out"]) != stamp_of(l) or not (out_root / l["out"]).exists())
    ]
    print(f"{len(todo)} / {len(lines)} 本を作る（声 {VOICE_VERSION}）", flush=True)
    if not todo:
        return

    torch.set_num_threads(os.cpu_count() or 4)
    model = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-Base", device_map="cpu", dtype=torch.float32)
    prompt = model.create_voice_clone_prompt(ref_audio=str(REF), ref_text=REF_TEXT)
    judge = Judge()

    best = {}  # id -> (結果, 波形, サンプリング周波数)
    qa = json.loads(qa_path.read_text()) if qa_path.exists() else {}
    pending = list(todo)
    started = time.time()
    for attempt in range(ATTEMPTS):
        if not pending:
            break
        print(f"\n--- {attempt + 1} 回目: {len(pending)} 本 ---", flush=True)
        for start in range(0, len(pending), BATCH):
            chunk = pending[start:start + BATCH]
            torch.manual_seed(7 + attempt * 1000 + start)
            wavs, sr = model.generate_voice_clone(
                text=[l["text"] for l in chunk],
                language=["Japanese" if l["lang"] == "ja" else "English" for l in chunk],
                voice_clone_prompt=prompt * len(chunk),
                do_sample=True,
                max_new_tokens=max_steps(chunk),
            )
            for line, wav in zip(chunk, wavs):
                wav = np.asarray(wav, dtype=np.float32)
                result = judge.score(wav, sr, line)
                if line["id"] not in best or result["rank"] > best[line["id"]][0]["rank"]:
                    best[line["id"]] = (result, wav, sr)
                    out = out_root / line["out"]
                    out.parent.mkdir(parents=True, exist_ok=True)
                    out.write_bytes(to_mp3(wav, sr))
                    qa[line["id"]] = {k: result[k] for k in ("heard", "seconds", "text", "speaker", "passed")}
                # 「作り終えた」と記録するのは、合格したときか最後の回だけ。
                # 途中で止めても、まだ直せるものは次に作り直される。
                if best[line["id"]][0]["passed"] or attempt == ATTEMPTS - 1:
                    stamps[line["out"]] = stamp_of(line)
                mark = "OK" if result["passed"] else "再"
                print(
                    f"  {mark} {line['id']:<14} {result['seconds']:4.1f}s 一致 {result['text']:.2f}"
                    f" 声 {result['speaker']:.2f}  {line['text'][:26]}",
                    flush=True,
                )
            stamps_path.write_text(json.dumps(stamps, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
            qa_path.write_text(json.dumps(qa, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
            done = start + len(chunk)
            eta = (time.time() - started) / max(done, 1) * (len(pending) - done)
            print(f"  … {done}/{len(pending)}（この回の残り約{eta / 60:.0f}分）", flush=True)
        pending = [l for l in pending if not best[l["id"]][0]["passed"]]

    review = [(l, best[l["id"]][0]) for l in todo if not best[l["id"]][0]["passed"]]
    total = sum((out_root / l["out"]).stat().st_size for l in todo)
    print(f"\n完了: {len(todo)} 本 / {total / 1024 / 1024:.1f}MB / {(time.time() - started) / 60:.0f}分 / 要確認 {len(review)} 本")
    for line, r in review:
        print(f"  {line['id']}: 「{line['text']}」→「{r['heard']}」 一致 {r['text']:.2f} 声 {r['speaker']:.2f}")


if __name__ == "__main__":
    sys.exit(main())
