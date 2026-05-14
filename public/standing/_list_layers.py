from psd_tools import PSDImage
from pathlib import Path

psd = PSDImage.open('moca-free.psd')
rows = []

def walk(layers, prefix=''):
    for i, layer in enumerate(layers):
        name = layer.name or '(no-name)'
        path = f"{prefix}/{name}" if prefix else name
        rows.append({
            'path': path,
            'visible': layer.is_visible(),
            'kind': 'group' if layer.is_group() else 'layer',
            'bbox': tuple(layer.bbox) if hasattr(layer, 'bbox') else None
        })
        if layer.is_group():
            walk(layer, path)

walk(psd)
out = Path('public/standing/_psd-layers.txt')
out.parent.mkdir(parents=True, exist_ok=True)
with out.open('w', encoding='utf-8') as f:
    for r in rows:
        f.write(f"{r['kind']}\t{r['visible']}\t{r['bbox']}\t{r['path']}\n")
print(f"LAYER_ROWS={len(rows)}")
print(f"OUT={out}")
