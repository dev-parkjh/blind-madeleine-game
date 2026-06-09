# Generated UI Assets

This folder contains generated UI reference sheets for the Blind Madeleine interface pass.

- `*.png`: transparent-background working images.
- `*_chromakey.png`: source renders with chromakey backgrounds kept for regeneration/reference.
- `_contact_sheet.png`: compact preview of the generated set.

The in-game UI is mostly built from Godot controls and `StyleBoxFlat` instances, so the generated art direction is applied through `scripts/ui/generated_ui_theme.gd` and the existing screen style factories.

`10_branch_tree.png` was locally composed from the shared art direction because the image generation run repeatedly failed for that specific sheet.
