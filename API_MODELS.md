# Video Factory — Confirmed fal.ai Model IDs

## Image Generation
- **Nano Banana 2 T2I**: `fal-ai/nano-banana-2`
  - params: prompt, aspect_ratio (auto/16:9/9:16/1:1/...), resolution (0.5K/1K/2K/4K), num_images, seed, thinking_level
- **Nano Banana 2 Edit (I2I)**: `fal-ai/nano-banana-2/edit`
  - params: prompt, image_url, aspect_ratio, resolution
- **Nano Banana Pro T2I**: `fal-ai/nano-banana-pro`
- **Nano Banana Pro Edit**: `fal-ai/nano-banana-pro/edit`

## Image Editing (Multi-image)
- **Seedream 5 Lite Edit**: `fal-ai/bytedance/seedream/v5/lite/edit`
  - params: prompt (required), image_urls (list, up to 10), image_size, num_images, enable_safety_checker
  - output: images[]

## Video Generation
- **Kling 3.0 Pro I2V**: `fal-ai/kling-video/v3/pro/image-to-video`
  - params: prompt, image_url, duration (5/10), aspect_ratio, cfg_scale, negative_prompt
- **Kling O3 I2V Pro**: `fal-ai/kling-video/o3/pro/image-to-video` (start+end frame)

## Video Editing
- **Kling O1 Video Edit**: `fal-ai/kling-video/o1/video-to-video/edit`
  - params: prompt (use @Element1, @Image1 refs), video_url (mp4/mov, 3-10s, 720-2160px, max 200MB)
  - optional: image_urls (up to 4 total), elements (frontal_image_url + reference_image_urls), keep_audio
  - output: video { url, content_type, file_size, file_name }

## Kling Motion Control (via direct Kling API, not fal.ai)
- Kling Motion Control uses the KLING_ACCESS_KEY + KLING_SECRET_KEY
- Endpoint: POST /v1/videos/motion-control (or similar)
- Uses reference video to transfer motion to image
- Already partially implemented in server/kling.ts via klingImageToVideo

## Notes
- All fal.ai calls use FAL_API_KEY (Bearer token)
- Use falRequest() helper from server/falai.ts
- Polling pattern: submit → poll status → get result URL
