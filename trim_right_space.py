#!/usr/bin/env python
"""
全24個の立ち絵から右側の空白を削除
各画像の非透過領域の右端を検出し、すべてで同じ幅になるように統一
"""

from PIL import Image
import numpy as np
from pathlib import Path

def get_content_bounds(img_path):
    """
    画像内のキャラクター（非透過部分）の境界を検出
    戻り値: (left, top, right, bottom)
    """
    img = Image.open(img_path).convert('RGBA')
    pixels = np.array(img)
    
    # アルファチャンネルを確認（0より大きい = 非透過）
    alpha = pixels[:, :, 3]
    
    # 非透過ピクセルの位置を検出
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)
    
    if not np.any(rows) or not np.any(cols):
        # 完全に透過（キャラなし）
        return 0, 0, img.width, img.height
    
    row_indices = np.where(rows)[0]
    col_indices = np.where(cols)[0]
    
    top = row_indices[0]
    bottom = row_indices[-1] + 1
    left = col_indices[0]
    right = col_indices[-1] + 1
    
    return left, top, right, bottom


def analyze_all_images():
    """
    全24ファイルを分析して、右端位置を記録
    """
    output_dir = Path('./public/standing/psd')
    
    print("=" * 70)
    print("全24ファイルの非透過領域を分析中...")
    print("=" * 70)
    
    bounds_list = []
    
    for i in range(1, 25):
        num = f"{i:02d}"
        img_path = output_dir / f'moca-stand-{num}.png'
        
        if not img_path.exists():
            print(f"❌ {num}: ファイルなし")
            continue
        
        left, top, right, bottom = get_content_bounds(str(img_path))
        width = right - left
        height = bottom - top
        
        bounds_list.append({
            'num': num,
            'left': left,
            'top': top,
            'right': right,
            'bottom': bottom,
            'width': width,
            'height': height
        })
        
        print(f"{num}: left={left:4}, right={right:4}, width={width:4}, height={height:4}")
    
    # 統計情報
    if bounds_list:
        left_min = min(b['left'] for b in bounds_list)
        right_max = max(b['right'] for b in bounds_list)
        width_max = max(b['width'] for b in bounds_list)
        height_max = max(b['height'] for b in bounds_list)
        
        print("\n" + "=" * 70)
        print("統計:")
        print(f"  左端の最小値: {left_min}")
        print(f"  右端の最大値: {right_max}")
        print(f"  幅の最大値: {width_max}")
        print(f"  高さの最大値: {height_max}")
        print("=" * 70)
        
        return bounds_list, left_min, right_max, width_max, height_max
    
    return None, None, None, None, None


def trim_and_align_images(bounds_list, target_left, target_right):
    """
    全24ファイルを同じ幅で切り取り、左端を統一
    """
    output_dir = Path('./public/standing/psd')
    
    trim_width = target_right - target_left
    
    print("\n" + "=" * 70)
    print(f"画像を切り取り中 (幅: {trim_width}px)")
    print("=" * 70)
    
    for bound in bounds_list:
        num = bound['num']
        img_path = output_dir / f'moca-stand-{num}.png'
        
        # 元画像を開く
        img = Image.open(img_path).convert('RGBA')
        
        # 統一した幅で切り取り（上から 1687px）
        # 左端: target_left, 右端: target_right, 高さ: 1687
        if img.height >= 1687:
            cropped = img.crop((target_left, 0, target_right, 1687))
        else:
            cropped = img.crop((target_left, 0, target_right, img.height))
        
        # 新しいキャンバスサイズに合わせてパディング
        new_width = trim_width
        new_height = 1687
        canvas = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
        
        # 切り取った画像を左端に貼り付け
        canvas.paste(cropped, (0, 0), cropped)
        
        # 保存
        canvas.save(str(img_path), 'PNG')
        
        print(f"✓ {num}: {img.size[0]} -> {new_width}px")
    
    print("\n✓ 全24ファイルの処理完了！")


if __name__ == '__main__':
    # ステップ1: 全ファイルを分析
    bounds_list, left_min, right_max, width_max, height_max = analyze_all_images()
    
    if bounds_list:
        # ステップ2: 統一した幅で切り取り
        trim_and_align_images(bounds_list, left_min, right_max)
