# Physics And Collision Policy

- Collision ownership must be explicit for every gameplay object:
	- body type: static, kinematic, dynamic, trigger, or visual-only
	- collider shape: primitive, compound primitive, convex, mesh, or none
	- collision layer and mask
	- mass, damping, friction, restitution when simulated
	- sleeping and continuous collision detection policy
- Prefer primitive or compound primitive colliders for dynamic gameplay objects.
- Mesh colliders are acceptable for static environment queries only when a simpler collider cannot preserve the needed gameplay shape.
- Configure collision layers to exclude impossible interactions before physics queries run.
- Fast small objects must document whether swept collision or continuous collision detection is required.
- Pooled physics objects must reset transform, velocities, enabled state, collision state, timers, event subscriptions, and gameplay ownership before reuse.
