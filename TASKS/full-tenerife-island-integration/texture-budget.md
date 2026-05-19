# Texture Budget: Full Tenerife Island

## Identity

- Texture set id: `tenerife-full-island-albedo`
- Asset id: `tenerife-full-island-source`
- Source path: embedded in `public/models/land/tenerife._islas_canarias.glb`
- Runtime path: not yet extracted
- Date: 2026-05-18

## Usage

- Usage: world material
- Rendered distance range: near terrain under player through far island overview
- Maximum expected screen size: large terrain surface, but details are broad satellite/height context
- Needs alpha: no
- Needs transparency sorting: no

## Maps

| Map | Source File | Runtime Size | Color/Data | Mipmaps | Compression Target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Base color | embedded `material_0_baseColor.png` | source `8192 x 8192`; first runtime target `4096 x 4096`, fallback `2048 x 2048` | color | yes | JPEG/WebP or KTX2 later | 8K source is too large for default browser pass |
| Normal | none | none | data | no | none | Use mesh normals first |
| Metallic/Roughness | material factors | none | data | no | none | Terrain should be non-metallic and rough |
| AO | none | none | data | no | none | Not required for first pass |
| Emissive | none | none | color | no | none | Not required |

## Policy

- Power-of-two dimensions: yes
- Max texture size justified: not for default runtime; use downscaled runtime copy first
- Mipmap policy justified: yes, terrain is viewed at variable distance
- Streaming/loading expectation: initial full-island mode may preload, but production should stream or use LOD
- Web compression candidate: KTX2/Basis later, JPEG/WebP fallback first
- Memory risk: high with 8K, medium with 4K, lower with 2K

## Validation

- Checked in Blender: source render checked
- Checked in glTF viewer: no
- Checked in Babylon runtime: no
- Visual artifacts:
	- source texture includes a large rectangular background around the island
	- water should not be visually represented by the imported texture
- Follow-up:
	- extract texture during Blender normalization
	- test 4096 vs 2048 in browser screenshots
