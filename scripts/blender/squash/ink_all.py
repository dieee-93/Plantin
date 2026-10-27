import os
import sys

this_dir = os.path.dirname(os.path.abspath(__file__))
from ink_preview import apply_cartoon_ink

stages = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'harvested']
for s in stages:
    raw = f'scripts/out/cartoon_squash_{s}_raw.png'
    out = os.path.join(this_dir, 'renders', f'cartoon_squash_{s}.png')
    apply_cartoon_ink(raw, out, line_width=3)
