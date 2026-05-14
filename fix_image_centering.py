#!/usr/bin/env python
"""
キャラクター画像を正確に中央配置するスクリプト
ImageMagick + Python で各画像を処理
"""

from PIL import Image
import subprocess
from pathlib import Path

def get_trimmed_bounds(img_path):
    """
    ImageMagick の -trim による削除領域を計算
    """
    img = Image.open(img_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    bbox = img.getbbox()  # (left, top, right, bottom)
    return bbox

def process_single_image(input_path, output_path):
    """
    単一画像を正確に中央配置で処理
    """
    img = Image.open(input_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # 透過以外の領域を検出
    bbox = img.getbbox()
    if not bbox:
        print(f"⚠ No content: {input_path}")
        return False
    
    left, top, right, bottom = bbox
    content_width = right - left
    content_height = bottom - top
    
    # キャラクターの中心 X座標
    char_center_x = left + content_width / 2.0
    
    # ターゲットキャンバスの中心 X座標（1979の中心 = 989.5）
    target_center_x = 1979 / 2.0
    
    # 必要なオフセット
    offset_x = target_center_x - char_center_x
    
    # キャンバスを作成（上から 1687px）
    canvas = Image.new('RGBA', (1979, 1687), (0, 0, 0, 0))
    
    # オフセットを計算（丸める）
    paste_x = int(offset_x)
    paste_y = 0  # 上寄せ
    
    # 元画像全体を貼り付け（オフセット付き）
    canvas.paste(img, (paste_x, paste_y), img)
    
    # 必要に応じてクロップ（上から1687px）
    if canvas.size[1] > 1687:
        canvas = canvas.crop((0, 0, 1979, 1687))
    
    # 保存
    canvas.save(output_path, 'PNG')
    
    print(f"✓ {Path(input_path).name:20} char_center={char_center_x:6.1f}, offset={offset_x:7.1f}, paste_x={paste_x:4}")
    return True

def process_all_images():
    """全24ファイルを処理"""
    backup_dir = Path('./public/standing/psd/backup_originals')
    output_dir = Path('./public/standing/psd')
    
    success_count = 0
    
    for i in range(1, 25):
        filename = f'moca-stand-{i:02d}.png'
        input_path = backup_dir / filename
        output_path = output_dir / filename
        
        if not input_path.exists():
            print(f"❌ Not found: {filename}")
            continue
        
        if process_single_image(str(input_path), str(output_path)):
            success_count += 1
    
    print(f"\n✓ 処理完了: {success_count}/24 ファイル")

if __name__ == '__main__':
    print("キャラクター画像の中央配置を修正中...\n")
    process_all_images()
    print("\n完了！")
