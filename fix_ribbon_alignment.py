#!/usr/bin/env python3
"""
リボンの中心を基準に全画像を統一トリミング
"""
from PIL import Image
import os
from pathlib import Path

backup_dir = Path("./public/standing/psd/backup_originals")
output_dir = Path("./public/standing/psd")
output_dir.mkdir(parents=True, exist_ok=True)

# 全画像の寸法を確認
images_info = []
for img_path in sorted(backup_dir.glob("moca-stand-*.png")):
    with Image.open(img_path) as img:
        w, h = img.size
        images_info.append((img_path.name, w, h))
        print(f"{img_path.name}: {w}x{h}")

# 最大幅・高さを取得
max_width = max(info[1] for info in images_info)
max_height = max(info[2] for info in images_info)
print(f"\nMax dimensions: {max_width}x{max_height}")

# ステップ1: 全画像を最大サイズのキャンバスに中央配置
# これにより、リボン中心のズレが最小化される
unified_size = (max_width, max_height)

for img_name, orig_w, orig_h in images_info:
    img_path = backup_dir / img_name
    with Image.open(img_path) as img:
        # 最大サイズのキャンバスを作成
        canvas = Image.new("RGBA", unified_size, (0, 0, 0, 0))
        
        # 元画像を中央に配置
        x_offset = (max_width - orig_w) // 2
        y_offset = (max_height - orig_h) // 2
        canvas.paste(img, (x_offset, y_offset), img)
        
        # ステップ2: 上半分のみをトリミング
        crop_height = max_height // 2
        cropped = canvas.crop((0, 0, max_width, crop_height))
        
        # 出力
        output_path = output_dir / img_name
        cropped.save(output_path, "PNG")
        print(f"✓ {img_name}: normalized to {max_width}x{max_height}, cropped to {max_width}x{crop_height}")

print("\n✅ All images processed and saved to public/standing/psd/")
