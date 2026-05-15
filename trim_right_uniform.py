#!/usr/bin/env python
"""
trim_right_uniform.py

右側の空白を全立ち絵で同じ幅だけ切り取るスクリプト。
動作:
 1. public/standing/psd 内の立ち絵 (moca-stand-XX.png) を解析
 2. 各画像の非透過領域の右端を取得し、右側の空白(px) を計算
 3. 全画像で取り除ける最大の共通空白量(= min(blank)) を求める
 4. そのピクセル幅だけ右端から切り取り、同じ幅で保存
 5. 変更前のファイルを public/standing/psd/right_trim_backup/ にバックアップ

Pillow が必要です。venv を使っている場合は
  .\\.venv\\Scripts\\python.exe -m pip install pillow
でインストールしてください。

実行:
  .\\.venv\\Scripts\\python.exe trim_right_uniform.py

注意: ユーザーの要望どおり "同じ幅を切り取る" を実行します。
      切り取り量はすべての画像で安全に取り除ける最小の右余白に基づきます。
"""

from PIL import Image
from pathlib import Path
import shutil

PSD_DIR = Path('./public/standing/psd')
BACKUP_DIR = PSD_DIR / 'right_trim_backup'

def get_nontransparent_right(px_img):
    """RGBA画像の右端（非透過）の x 座標（0-based, exclusive）を返す"""
    w, h = px_img.size
    alpha = px_img.split()[-1]
    alpha_data = alpha.load()
    # 右から走査して最初に非透過が見つかった列の次のインデックスを返す
    for x in range(w - 1, -1, -1):
        for y in range(h):
            if alpha_data[x, y] != 0:
                return x + 1
    return 0

def main():
    PSD_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    files = sorted(PSD_DIR.glob('moca-stand-*.png'))
    if not files:
        print('✗ 立ち絵ファイルが見つかりません: public/standing/psd')
        return

    rights = []
    widths = []
    print('解析中: 各画像の右端を検出しています...')
    for f in files:
        img = Image.open(f).convert('RGBA')
        r = get_nontransparent_right(img)
        rights.append(r)
        widths.append(img.width)
        print(f'  {f.name}: width={img.width}, right_nontrans={r}, right_blank={img.width - r}')

    # すべて同じ元幅であることを期待
    base_width = max(widths)
    # 各画像で安全に切り取れる右余白の最小値
    blanks = [w - r for w, r in zip(widths, rights)]
    min_blank = min(blanks)

    if min_blank <= 0:
        print('✱ 切り取り可能な右余白がありません（min_blank<=0）。処理を中止します。')
        return

    new_width = base_width - min_blank
    print('\n計画: 全画像の右から {} px を削除して、幅を {} px に統一します。'.format(min_blank, new_width))

    # バックアップと切り取り処理
    for f in files:
        backup_path = BACKUP_DIR / f.name
        if not backup_path.exists():
            shutil.copy2(f, backup_path)

        img = Image.open(f).convert('RGBA')
        w, h = img.size
        crop_right = w - min_blank
        if crop_right <= 0:
            print(f'  ⚠ {f.name}: 切り取り後の幅が不正: {crop_right} (スキップ)')
            continue

        # 上から1687pxのキャンバスを想定しているため、縦は0..1687に合わせる
        crop_bottom = min(1687, h)
        cropped = img.crop((0, 0, crop_right, crop_bottom))

        # 必要なら縦方向パディング
        if crop_bottom < 1687:
            canvas = Image.new('RGBA', (crop_right, 1687), (0, 0, 0, 0))
            canvas.paste(cropped, (0, 0), cropped)
            canvas.save(f, 'PNG')
        else:
            cropped.save(f, 'PNG')

        print(f'  ✓ {f.name}: {w} -> {crop_right} px')

    print('\n完了: 右側空白をすべての立ち絵で同じ幅だけ切り取りました。')
    print(f'バックアップは {BACKUP_DIR} に保存されています。')

if __name__ == "__main__":
    main()
