from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image
from psd_tools import PSDImage

ROOT = Path(__file__).resolve().parent.parent
PSD_PATH = ROOT / "moca-free.psd"
OUT_DIR = ROOT / "public" / "standing" / "psd"


# 睡眠ガイド向けに、刺激の強い差分は避けて穏やかなレイヤーだけを使う
BASE_LAYERS = [
    "体",
    "上着/上着",
    "上着/シャツ",
    "頬/通常",
    "前パーツ/いつもの髪飾り",
]

ARM_VARIANTS = [
    "右腕/降ろし",
    "右腕/口に手",
    "右腕/提案",
    "両腕/お淑やか",
    "両腕/手合わせ",
]

EYE_VARIANTS = [
    "通常/通常",
    "通常/下向き",
    "通常/うるうる",
    "通常/三白眼",
    "通常/猫目",
    "通常/しいたけ",
]

BROW_VARIANTS = [
    "眉毛/通常",
    "眉毛/悲しみ",
    "眉毛/疑問",
]

MOUTH_VARIANTS = [
    "口/にこ",
    "口/ん",
    "口/ω",
    "口/はは",
    "口/ﾆﾁｬ笑み",
    "口/猫わ",
]

# 24種類ちょうど生成する
POSE_SPECS: list[tuple[str, str, str, str]] = [
    ("右腕/降ろし", "通常/通常", "眉毛/通常", "口/にこ"),
    ("右腕/口に手", "通常/下向き", "眉毛/通常", "口/ん"),
    ("両腕/お淑やか", "通常/通常", "眉毛/悲しみ", "口/ω"),
    ("両腕/手合わせ", "通常/うるうる", "眉毛/通常", "口/にこ"),
    ("右腕/提案", "通常/通常", "眉毛/疑問", "口/はは"),
    ("右腕/降ろし", "通常/猫目", "眉毛/通常", "口/猫わ"),
    ("右腕/口に手", "通常/しいたけ", "眉毛/悲しみ", "口/ん"),
    ("両腕/お淑やか", "通常/下向き", "眉毛/通常", "口/ω"),
    ("両腕/手合わせ", "通常/通常", "眉毛/通常", "口/はは"),
    ("右腕/提案", "通常/うるうる", "眉毛/疑問", "口/にこ"),
    ("右腕/降ろし", "通常/三白眼", "眉毛/通常", "口/ﾆﾁｬ笑み"),
    ("右腕/口に手", "通常/通常", "眉毛/悲しみ", "口/猫わ"),
    ("両腕/お淑やか", "通常/猫目", "眉毛/通常", "口/にこ"),
    ("両腕/手合わせ", "通常/しいたけ", "眉毛/通常", "口/ん"),
    ("右腕/提案", "通常/下向き", "眉毛/疑問", "口/ω"),
    ("右腕/降ろし", "通常/うるうる", "眉毛/悲しみ", "口/にこ"),
    ("右腕/口に手", "通常/三白眼", "眉毛/通常", "口/はは"),
    ("両腕/お淑やか", "通常/通常", "眉毛/疑問", "口/猫わ"),
    ("両腕/手合わせ", "通常/下向き", "眉毛/通常", "口/ﾆﾁｬ笑み"),
    ("右腕/提案", "通常/猫目", "眉毛/通常", "口/にこ"),
    ("右腕/降ろし", "通常/しいたけ", "眉毛/悲しみ", "口/ω"),
    ("右腕/口に手", "通常/うるうる", "眉毛/通常", "口/猫わ"),
    ("両腕/お淑やか", "通常/三白眼", "眉毛/疑問", "口/はは"),
    ("両腕/手合わせ", "通常/猫目", "眉毛/通常", "口/にこ"),
]


def build_layer_map(psd: PSDImage) -> dict[str, object]:
    mapping: dict[str, object] = {}

    def walk(layers: Iterable, prefix: str = "") -> None:
        for layer in layers:
            name = layer.name or "(no-name)"
            path = f"{prefix}/{name}" if prefix else name
            if not layer.is_group():
                mapping[path] = layer
            else:
                walk(layer, path)

    walk(psd)
    return mapping


def paste_layer(canvas: Image.Image, layer) -> None:
    part = layer.topil()
    if part is None:
        return
    x1, y1, _, _ = layer.bbox
    canvas.alpha_composite(part, (x1, y1))


def main() -> int:
    if not PSD_PATH.exists():
        raise FileNotFoundError(f"PSD not found: {PSD_PATH}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    psd = PSDImage.open(PSD_PATH)
    layer_map = build_layer_map(psd)

    required = set(BASE_LAYERS)
    for arm, eye, brow, mouth in POSE_SPECS:
        required.update([arm, eye, brow, mouth])

    missing = [name for name in sorted(required) if name not in layer_map]
    if missing:
        raise KeyError(f"Missing layer paths: {missing}")

    for i, (arm, eye, brow, mouth) in enumerate(POSE_SPECS, start=1):
        canvas = Image.new("RGBA", (psd.width, psd.height), (0, 0, 0, 0))

        for path in BASE_LAYERS:
            paste_layer(canvas, layer_map[path])

        paste_layer(canvas, layer_map[arm])
        paste_layer(canvas, layer_map[brow])
        paste_layer(canvas, layer_map[eye])
        paste_layer(canvas, layer_map[mouth])

        out_file = OUT_DIR / f"moca-stand-{i:02d}.png"
        canvas.save(out_file, format="PNG", optimize=True)

    print(f"GENERATED={len(POSE_SPECS)}")
    print(f"OUTPUT_DIR={OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
