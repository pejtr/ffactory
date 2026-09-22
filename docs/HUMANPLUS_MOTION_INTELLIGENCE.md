# HumanPlus-1000 → OMNIVIDEO Motion Intelligence v0.1

Status: **research-only foundation**
Branch: `feat/humanplus-motion-intelligence-v0.1`

## Goal

Introduce a provider-neutral motion representation that can later drive:
- ActionDNA / action decomposition
- body + hand motion control
- camera choreography
- motion/physics consistency evaluation
- SoulID-associated MotionID profiles

HumanPlus-1000 is an input source, not the canonical OMNIVIDEO format.
The canonical boundary is `MotionPacket v1`.

## Verified HumanPlus preview mapping

The public dataset card describes `annotation.hdf5` groups used by this adapter:
- `body_motion/T_mocapworld_root`
- `body_motion/smplh_pose`
- `body_motion/body_keypoints`
- `body_motion/foot_contact_probability`
- `hand_motion/{left,right}/...`
- `slam/T_slamworld_camera`
- `slam/point_cloud`
- `depth/depth`
- `behavior_annotation/{activity_summarization,motion_narration,atomic_action}`

Nanosecond timestamps are represented as decimal strings in OMNIVIDEO to avoid
JavaScript integer precision loss.

## License gate

The public preview is marked **CC-BY-NC-4.0**.
Therefore the adapter fails closed for:
- production generation
- commercial training
- commercial fine-tuning

Those paths require an explicit commercial license grant object.
Research loader/evaluation/noncommercial experiments remain allowed.

## Current implementation

`shared/motionIntelligence.ts`
defines the provider-neutral `MotionPacket v1` and `MotionControlHints`.

`server/integrations/humanplus/humanPlusAdapter.ts`
normalizes extracted HumanPlus frame data into `MotionPacket v1`, enforces
the license boundary, and exposes motion-control hints.

No dataset download, paid generation, model training, deployment, or production
mutation is performed by v0.1.

## Next engineering slice

Add a read-only HDF5 extractor behind the same adapter boundary, then verify one
public preview session end-to-end:

`annotation.hdf5 → extracted frame → MotionPacket → MotionControlHints`

Only after that should OMNIDirector consume MotionControlHints for shot planning.

## HDF5 read-only bridge

The integration now includes a real HDF5 extraction path:

`scripts/humanplus_extract.py`
→ `hdf5Extractor.ts`
→ `HumanPlusFrameInput`
→ `MotionPacket v1`
→ `MotionControlHints`

The Python reader opens annotations with `h5py.File(..., "r")` and never writes
to the source dataset. Depth maps and point clouds are intentionally not copied
into JSON; the packet only records their availability.

Install the optional reader in an isolated environment:

```powershell
python -m venv .venv-humanplus
.\.venv-humanplus\Scripts\python.exe -m pip install -r requirements-humanplus.txt
$env:HUMANPLUS_PYTHON = "$PWD\.venv-humanplus\Scripts\python.exe"
$env:HUMANPLUS_DATA_ROOT = "D:\datasets\HumanPlus-1000"
```

## OMNIVIDEO research API

`humanPlusRouter` exposes authenticated read-only research surfaces:

- `humanPlus.status` — reports configuration + hard license policy.
- `humanPlus.inspectFrame` — accepts only a relative annotation path under
  `HUMANPLUS_DATA_ROOT`, extracts one frame, and returns MotionPacket +
  MotionControlHints.

Path traversal and absolute client paths are blocked. The API never accepts a
commercial-purpose flag and never invokes rendering, billing, training, or
external publishing.

A local synthetic HDF5 smoke test was executed against the real Python reader
and verified body transform, hand validity/confidence, camera transform, depth
availability, point-cloud availability, nanosecond timestamp preservation, and
behavior annotations.
