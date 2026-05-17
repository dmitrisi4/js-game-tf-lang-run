# Texture Budget Template

Use this for every texture set that can affect runtime memory, loading, or material quality.

## Identity

- Texture set id:
- Asset id:
- Source path:
- Runtime path:
- Date:

## Usage

- Usage: world material | character | prop | UI | sky | lightmap | data texture | other
- Rendered distance range:
- Maximum expected screen size:
- Needs alpha: yes | no
- Needs transparency sorting: yes | no

## Maps

| Map | Source File | Runtime Size | Color/Data | Mipmaps | Compression Target | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Base color | | | color | yes/no | | |
| Normal | | | data | yes/no | | |
| Metallic/Roughness | | | data | yes/no | | |
| AO | | | data | yes/no | | |
| Emissive | | | color | yes/no | | |

## Policy

- Power-of-two dimensions: yes | no | exception:
- Max texture size justified: yes | no
- Mipmap policy justified: yes | no
- Streaming/loading expectation:
- Web compression candidate: KTX2/Basis | PNG/JPEG fallback | other
- Memory risk: low | medium | high

## Validation

- Checked in Blender: yes | no
- Checked in glTF viewer: yes | no
- Checked in Babylon runtime: yes | no
- Visual artifacts:
- Follow-up:
