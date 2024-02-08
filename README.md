# comfyui-json

To install dependencies:

```bash
bun install
```

To test locally run:

```bash
bun run src/cli.ts -i "./workflow_api.json" -c "path/to/your/ComfyUI"
```

Example output

```
{
  "comfyui": "d1533d9c0f1dde192f738ef1b745b15f49f41e02",
  "custom_nodes": {
    "https://github.com/ltdrdata/ComfyUI-Impact-Pack": {
      "url": "https://github.com/ltdrdata/ComfyUI-Impact-Pack",
      "name": "ComfyUI Impact Pack",
      "hash": "585787bfa7fe0916821add13aa0e2a01c999a4df",
      "warning": "No hash found in snapshot, using latest commit hash",
      "pip": [
        "ultralytics"
      ]
    }
  },
  "models": {
    "checkpoints": [
      {
        "name": "SD1.5/V07_v07.safetensors"
      }
    ]
  },
  "files": {
    "images": [
      {
        "name": "2pass-original.png"
      }
    ]
  }
}
```