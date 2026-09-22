#!/usr/bin/env python
"""Read one HumanPlus-1000 annotation frame and emit a compact JSON object.

Read-only by design: the HDF5 file is opened with mode="r". Large arrays such as
point clouds and depth maps are not serialized; only their availability is
reported. Requires h5py (see requirements-humanplus.txt).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import h5py
    import numpy as np
except ImportError as exc:
    print(
        json.dumps({
            "error": "HUMANPLUS_HDF5_DEPENDENCY_MISSING",
            "detail": str(exc),
            "hint": "Install requirements-humanplus.txt in an isolated venv.",
        }),
        file=sys.stderr,
    )
    raise SystemExit(3)

def _decode(value):
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, np.bytes_):
        return bytes(value).decode("utf-8", errors="replace")
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, np.ndarray):
        if value.dtype.kind in {"S", "U", "O"}:
            return [_decode(v) for v in value.tolist()]
        return value.tolist()
    return value


def _dataset_value(handle, path: str, frame_index: int):
    if path not in handle:
        return None
    dataset = handle[path]
    if not isinstance(dataset, h5py.Dataset):
        return None
    if dataset.shape == ():
        return _decode(dataset[()])
    if not dataset.shape or frame_index >= dataset.shape[0]:
        return None
    return _decode(dataset[frame_index])


def _flatten(value):
    if value is None:
        return None
    array = np.asarray(value)
    return array.reshape(-1).tolist()

def _text_value(handle, path: str, frame_index: int):
    value = _dataset_value(handle, path, frame_index)
    if value is None:
        return None
    if isinstance(value, list):
        if len(value) == 1:
            value = value[0]
        else:
            return " ".join(str(v) for v in value)
    return str(value)


def _hand(handle, side: str, frame_index: int):
    prefix = f"hand_motion/{side}"
    valid = _dataset_value(handle, f"{prefix}/valid", frame_index)
    confidence = _dataset_value(handle, f"{prefix}/confidence", frame_index)
    orient = _dataset_value(handle, f"{prefix}/mano_hand_global_orient", frame_index)
    pose = _dataset_value(handle, f"{prefix}/mano_hand_pose", frame_index)
    betas = _dataset_value(handle, f"{prefix}/mano_betas", frame_index)
    joints = _dataset_value(handle, f"{prefix}/joints_3d", frame_index)
    wrist = _dataset_value(handle, f"{prefix}/wrist_position_camera", frame_index)

    if all(v is None for v in (valid, confidence, orient, pose, betas, joints, wrist)):
        return None

    return {
        "manoHandGlobalOrient": _flatten(orient),
        "manoHandPose": _flatten(pose),
        "manoBetas": _flatten(betas),
        "joints3d": joints,
        "wristPositionCamera": _flatten(wrist),
        "valid": bool(valid) if valid is not None else None,
        "confidence": float(confidence) if confidence is not None else None,
    }

def extract(annotation_path: Path, session_id: str, frame_index: int):
    with h5py.File(annotation_path, "r") as handle:
        timestamp = _dataset_value(handle, "video/timestamp_ns", frame_index)
        if timestamp is None:
            timestamp = _dataset_value(handle, "synchronization/utc_ns", frame_index)
        if timestamp is None:
            raise ValueError(
                f"No timestamp found for frame {frame_index}; expected video/timestamp_ns "
                "or synchronization/utc_ns"
            )

        root = _dataset_value(handle, "body_motion/T_mocapworld_root", frame_index)
        smplh_pose = _dataset_value(handle, "body_motion/smplh_pose", frame_index)
        keypoints = _dataset_value(handle, "body_motion/body_keypoints", frame_index)
        foot_contact = _dataset_value(
            handle, "body_motion/foot_contact_probability", frame_index
        )

        camera = _dataset_value(handle, "slam/T_slamworld_camera", frame_index)
        camera_frame = None
        if "slam" in handle and isinstance(handle["slam"], h5py.Group):
            camera_frame = _decode(handle["slam"].attrs.get("camera_frame"))

        result = {
            "sessionId": session_id,
            "timestampNs": str(int(timestamp)),
            "bodyMotion": {
                "mocapWorldRoot": _flatten(root),
                "smplhPose": _flatten(smplh_pose),
                "bodyKeypoints": keypoints,
                "footContactProbability": _flatten(foot_contact),
            },
            "handMotion": {
                "left": _hand(handle, "left", frame_index),
                "right": _hand(handle, "right", frame_index),
            },
            "slam": {
                "slamWorldCamera": _flatten(camera),
                "cameraFrame": str(camera_frame) if camera_frame is not None else None,
                "pointCloudAvailable": "slam/point_cloud" in handle,
            },
            "depth": {
                "available": "depth/depth" in handle,
            },
            "behavior": {
                "activitySummarization": _text_value(
                    handle, "behavior_annotation/activity_summarization", frame_index
                ),
                "motionNarration": _text_value(
                    handle, "behavior_annotation/motion_narration", frame_index
                ),
                "atomicAction": _text_value(
                    handle, "behavior_annotation/atomic_action", frame_index
                ),
            },
        }

        # Remove null leaves while preserving false booleans and empty arrays.
        def clean(value):
            if isinstance(value, dict):
                cleaned = {k: clean(v) for k, v in value.items() if v is not None}
                return {k: v for k, v in cleaned.items() if v != {}}
            return value

        return clean(result)

def main() -> int:
    parser = argparse.ArgumentParser(description="Extract one HumanPlus HDF5 frame")
    parser.add_argument("--annotation", required=True, type=Path)
    parser.add_argument("--session-id", required=True)
    parser.add_argument("--frame-index", type=int, default=0)
    args = parser.parse_args()

    if args.frame_index < 0:
        parser.error("--frame-index must be >= 0")
    if args.annotation.suffix.lower() not in {".hdf5", ".h5"}:
        parser.error("--annotation must be an .hdf5 or .h5 file")
    if not args.annotation.is_file():
        parser.error(f"annotation file does not exist: {args.annotation}")

    try:
        payload = extract(args.annotation, args.session_id, args.frame_index)
    except Exception as exc:
        print(
            json.dumps({
                "error": "HUMANPLUS_HDF5_READ_FAILED",
                "detail": str(exc),
                "frameIndex": args.frame_index,
            }),
            file=sys.stderr,
        )
        return 4

    print(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
