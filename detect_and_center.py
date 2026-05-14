#!/usr/bin/env python
"""
チョーカー/リボンの位置を検出して中央配置
PIL のみを使用した軽量版
"""

from PIL import Image
import numpy as np
from pathlib import Path

def detect_character_center_x(img_path):
    """
    画像内のキャラクター（非透過部分）の水平中心を検出
    チョーカー/リボンが含まれる領域を探索
    """
    img = Image.open(img_path).convert('RGBA')
    pixels = np.array(img)
    
    # アルファチャンネル（透度）を確認
    alpha = pixels[:, :, 3]
    
    # 上から 35% の範囲でチョーカー/リボンを探す
    h = img.height
    crop_bottom = int(h * 0.35)
    alpha_upper = alpha[:crop_bottom, :]
    
    # 透度が 0 以上のピクセルを検出（キャラクター領域）
    non_transparent_cols = np.where(np.any(alpha_upper > 0, axis=0))[0]
    
    if len(non_transparent_cols) > 0:
        # 非透過領域の左端と右端
        left = non_transparent_cols[0]
        right = non_transparent_cols[-1]
        center_x = (left + right) / 2.0
        
        # 相対位置（0.0 - 1.0）
        relative_pos = center_x / img.width
        return relative_pos, center_x, left, right
    
    # 検出失敗時は中央
    return 0.5, img.width / 2.0, 0, img.width


def center_image_horizontally(input_path, output_path, canvas_width=1979, canvas_height=1687):
    """
    検出された位置を基準に画像を中央配置
    """
    detected_pos, center_x, left, right = detect_character_center_x(input_path)
    
    # 元画像を開く
    img = Image.open(input_path).convert('RGBA')
    
    # 上から canvas_height px をクロップ
    if img.size[1] >= canvas_height:
        cropped = img.crop((0, 0, img.width, canvas_height))
    else:
        cropped = img
    
    # キャンバスを作成
    canvas = Image.new('RGBA', (canvas_width, canvas_height), (0, 0, 0, 0))
    
    # チョーカー位置がキャンバスの中央に来るようにオフセット計算
    target_center = canvas_width / 2.0
    offset_x = int(target_center - center_x)
    
    # 画像を貼り付け
    canvas.paste(cropped, (offset_x, 0), cropped)
    
    # 保存
    canvas.save(output_path, 'PNG')
    
    return detected_pos, offset_x, center_x


# 実行
if __name__ == '__main__':
    backup_dir = Path('./public/standing/psd/backup_originals')
    output_dir = Path('./public/standing/psd')
    
    print("=" * 70)
    print("チョーカー位置検出による中央配置処理")
    print("=" * 70)
    
    for i in range(1, 25):
        num = f"{i:02d}"
        input_path = backup_dir / f'moca-stand-{num}.png'
        output_path = output_dir / f'moca-stand-{num}.png'
        
        if not input_path.exists():
            print(f"❌ {num}: ファイルなし")
            continue
        
        detected_pos, offset_x, center_x = center_image_horizontally(str(input_path), str(output_path))
        
        print(f"{num}番: チョーカー中心x={center_x:6.1f}, offset={offset_x:5}, 相対位置={detected_pos:.2f}")
    
    print("\n" + "=" * 70)
    print("✓ 処理完了！")
    print("=" * 70)
