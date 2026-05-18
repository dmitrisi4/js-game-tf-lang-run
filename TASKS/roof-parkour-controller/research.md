# Research

## Local Diagnosis

The current roof traversal prototype is too close to a scripted launch:

- `Player.tsx` starts traversal only from a jump queued while grounded.
- The wall-jump phase applies a backward/upward velocity before any stable hang
state is established.
- The ledge phase moves the player toward a generated point, but it does not
validate capsule clearance, roof support, or visual foot contact at the target.
- The climb target comes from generated landing data, not from a runtime roof
surface probe.
- Grounding checks only include `ground1` and `tenerife-seabed`, so building
roofs are not treated as floor for normal player movement after traversal.
- `setTargetTransform`/teleport-style control is mixed into the normal dynamic
body loop, which can create unintuitive physics responses if not isolated.

The screenshot confirms the main symptom: the visual player appears suspended
near/above a roof edge instead of clearly hanging from a ledge or standing on a
roof. This can come from any combination of:

- capsule center height not matching the visual model's foot anchor;
- roof target generated from building height rather than the actual picked roof
surface;
- no post-climb downward snap to a valid roof floor;
- roof not counted as ground, keeping the visual in an airborne pose;
- ledge hang point placed at a player-body center rather than a hand/chest pose.

## Engine Research Findings

### Character Movement Is Usually Kinematic, Not Raw Rigidbody Impulse

Unity's `CharacterController` is explicitly for movement constrained by
collisions without handling a rigidbody directly. Its movement is performed by
calling `Move`, which is constrained by collisions and returns collision flags.
The relevant lesson for this project: player traversal should be an owned
character-controller state, not a one-off force that the physics simulation then
interprets freely.

Sources:

- https://docs.unity3d.com/ScriptReference/CharacterController.html
- https://docs.unity3d.com/ScriptReference/CharacterController.Move.html

### Wall/Floor Classification Must Be First-Class State

Unity exposes `CollisionFlags.Sides`, `Above`, and `Below` after movement.
Godot's `CharacterBody3D` exposes wall/floor/ceiling classification, floor
snap, safe margin, floor normals, wall normals, and slide collisions. These APIs
show the common pattern: the controller keeps explicit knowledge of whether the
capsule is touching floor, wall, or ceiling and uses that state to decide the
next movement mode.

Sources:

- https://docs.unity3d.com/ScriptReference/CollisionFlags.html
- https://docs.godotengine.org/en/latest/classes/class_characterbody3d.html

### Stable Landing Requires Floor Snap And Support Validation

Godot's `floor_snap_length` keeps a body attached to floor when appropriate, and
`safe_margin` exists specifically for collision recovery near surfaces. For our
case, the roof landing phase should not trust a generated `y` value alone. It
should:

- query the actual roof surface under the landing point;
- place the capsule center at `roofSurfaceY + capsuleHalfHeight + contactSkin`;
- verify there is no capsule overlap at that point;
- perform a short downward snap after climb-up;
- classify the building roof as floor for grounding.

Source:

- https://docs.godotengine.org/en/latest/classes/class_characterbody3d.html

### Babylon/Havok Transform Driving Needs Isolation

Babylon forum guidance around Havok shows that `setTargetTransform` computes
velocities internally and can create unintuitive motion when mixed with other
velocity/constraint logic. Another Babylon discussion recommends changing
prestep and then changing the attached transform for teleport-style updates.
For this project, controlled parkour phases should be isolated from normal
movement and should restore the physics body cleanly afterward.

Sources:

- https://forum.babylonjs.com/t/set-rotation-of-physicsbody-havok-programmatically/47002
- https://forum.babylonjs.com/t/settargettransform-throw-meshes/51990

## Design Conclusion

Do not continue tuning the current impulse-first implementation. Replace it with
a small roof traversal controller that owns these states:

1. `idle` - normal player movement.
2. `wall-contact` - wall is detected, normal is known, jump can become parkour.
3. `ledge-probe` - validate ledge, roof surface, hang clearance, and landing.
4. `ledge-hang` - freeze player in a clear hang pose outside the wall.
5. `climb-up` - deterministic interpolation/root-motion-like movement.
6. `roof-snap` - downward floor snap to actual roof surface.
7. `recover` - return to normal locomotion with roof counted as ground.

The controller should never select a roof center just because it is nearby. It
should choose a landing by probing from the wall hit toward candidate roof areas
and then snapping to a real roof surface.
