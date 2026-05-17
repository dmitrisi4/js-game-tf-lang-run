# Physics Object Template

Use this for every gameplay object that collides, triggers, moves, or participates in physics queries.

## Identity

- Object id:
- Related asset:
- Runtime owner:
- Source files:
- Date:

## Body Policy

- Body type: static | kinematic | dynamic | trigger | visual-only
- Gameplay authority: physics body | controller capsule | trigger | scripted transform | none
- Visual mesh authoritative: no
- Collider shape: primitive | compound primitive | convex | mesh | none
- Shape dimensions:
- Offset from visual:

## Material And Motion

- Mass:
- Inertia policy:
- Linear damping:
- Angular damping:
- Friction:
- Restitution:
- Gravity:
- Sleeping: enabled | disabled | not applicable
- CCD/swept collision: required | not required | unknown

## Collision Filtering

- Collision layer:
- Collision mask:
- Can collide with:
- Must ignore:
- Trigger-only interactions:

## Lifecycle

- Spawned: at load | runtime | pooled
- Pool reset needed: yes | no
- Reset fields:
	- transform
	- linear/angular velocity
	- enabled state
	- collision state
	- timers
	- event subscriptions
	- gameplay ownership

## Validation

- Physics debug checked: yes | no
- Tunneling checked: yes | no
- Resting/sleeping checked: yes | no
- Performance risk: low | medium | high
- Open issues:
