#!/usr/bin/env python
"""
チョーカー/リボンの位置を検出して、各画像を正確に中央配置
OpenCV と Pillow を使用して特徴検出と配置を実行
"""

from PIL import Image
import cv2
import numpy as np
from pathlib import Path

def detect_choker_position(img_path):
    """
    チョーカー/リボンの位置を検出
    
    返り値: (水平中心位置, 検出成功の有無)
    - 水平中心位置: 0-1の相対位置（0.5 = 中央）
    """
    # OpenCV で画像を読み込む
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return None, False
    
    # RGBA の場合、BGR に分離
    if len(img.shape) == 3 and img.shape[2] == 4:
        bgr = img[:, :, :3]
    else:
        bgr = img
    
    # HSV に変換（紫色のチョーカーを検出するため）
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    
    # チョーカーの色范囲（紫系）を定義
    # 紫：H=280-320（HSVでは140-160）
    lower_purple = np.array([125, 30, 30])
    upper_purple = np.array([170, 255, 255])
    
    # マスク作成（紫色を検出）
    mask_purple = cv2.inRange(hsv, lower_purple, lower_purple + 50)
    
    # 紫色が検出された場合、その水平中心を使う
    purple_x = np.where(mask_purple > 0)
    if len(purple_x[1]) > 10:  # ノイズフィルタ
        # 紫色ピクセルの水平位置の中央値
        x_positions = purple_x[1]
        center_x = np.median(x_positions)
        relative_pos = center_x / img.shape[1]
        return relative_pos, True
    
    # 紫色が検出されない場合、グレースケール処理
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    
    # 上から30%をチョーカー領域とみなす
    h = img.shape[0]
    crop_bottom = int(h * 0.30)
    gray_upper = gray[:crop_bottom, :]
    
    # エッジ検出
    edges = cv2.Canny(gray_upper, 30, 100)
    
    # 垂直方向の投影（各列のエッジピクセル数）
    vertical_projection = np.sum(edges, axis=0)
    
    if np.max(vertical_projection) > 0:
        # ピークを探す（キャラクターの中心）
        center_x = np.argmax(vertical_projection)
        relative_pos = center_x / img.shape[1]
        return relative_pos, True
    
    # 検出失敗時は中央
    return 0.5, False


def calculate_horizontal_offset(detected_pos, canvas_width=1979):
    """
    検出された位置から、中央配置に必要なオフセットを計算
    """
    if detected_pos is None:
        return 0
    
    # 検出位置が canvas_width の中央に来るようにオフセットを計算
    target_center = canvas_width / 2.0
    detected_center_in_pixels = detected_pos * canvas_width
    offset = target_center - detected_center_in_pixels
    
    return int(offset)


def process_image_with_detected_position(input_path, output_path, canvas_width=1979, canvas_height=1687):
    """
    検出された位置を基準に、画像を中央配置で処理
    """
    # チョーカー位置を検出
    detected_pos, success = detect_choker_position(input_path)
    
    if detected_pos is None:
        print(f"  ❌ 画像読み込み失敗")
        return False
    
    # 元画像を Pillow で開く
    pil_img = Image.open(input_path)
    if pil_img.mode != 'RGBA':
        pil_img = pil_img.convert('RGBA')
    
    # 上から canvas_height px をクロップ
    if pil_img.size[0] >= canvas_width and pil_img.size[1] >= canvas_height:
        cropped = pil_img.crop((0, 0, canvas_width, canvas_height))
    else:
        cropped = pil_img
    
    # キャンバスを作成
    canvas = Image.new('RGBA', (canvas_width, canvas_height), (0, 0, 0, 0))
    
    # 検出位置に基づいてオフセットを計算
    offset_x = calculate_horizontal_offset(detected_pos, canvas_width)
    
    # 画像を貼り付け（オフセット付き）
    paste_x = offset_x
    paste_y = 0
    canvas.paste(cropped, (paste_x, paste_y), cropped)
    
    # 保存
    canvas.save(output_path, 'PNG')
    
    print(f"  ✓ 処理完了: offset_x={offset_x}")
    return True


def process_all_images():
    """全24ファイルを処理"""
    backup_dir = Path('./public/standing/psd/backup_originals')
    output_dir = Path('./public/standing/psd')
    
    print("=" * 60)
    print("チョーカー位置検出による中央配置処理")
    print("=" * 60)
    
    success_count = 0
    
    for i in range(1, 25):
        num = f"{i:02d}"
        input_path = backup_dir / f'moca-stand-{num}.png'
        output_path = output_dir / f'moca-stand-{num}.png'
        
        if not input_path.exists():
            print(f"❌ {num}: ファイルなし")
            continue
        
        print(f"\n{num}番を処理中...")
        if process_image_with_detected_position(str(input_path), str(output_path)):
            success_count += 1
    
    print("\n" + "=" * 60)
    print(f"✓ 処理完了: {success_count}/24 ファイル")
    print("=" * 60)


if __name__ == '__main__':
    process_all_images()
