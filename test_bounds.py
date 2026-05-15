#!/usr/bin/env python
from PIL import Image
import numpy as np

# テスト用：最初のファイルだけ分析
img_path = './public/standing/psd/moca-stand-01.png'
img = Image.open(img_path).convert('RGBA')
pixels = np.array(img)

# アルファチャンネルを確認
alpha = pixels[:, :, 3]

# 非透過ピクセルの位置
cols = np.any(alpha > 0, axis=0)
col_indices = np.where(cols)[0]

if len(col_indices) > 0:
    left = col_indices[0]
    right = col_indices[-1] + 1
    width = right - left
    print(f"moca-stand-01.png:")
    print(f"  キャラクター領域: left={left}, right={right}")
    print(f"  キャラクター幅: {width}px")
    print(f"  元の幅: {img.width}px")
    print(f"  右側の空白: {img.width - right}px")
else:
    print("非透過領域が見つかりません")
