# Gameplay V2 — real tangle model

## Why the old model was wrong

The first implementation treated the puzzle mostly as circular endpoint order. If two rope endpoints alternated around the ring, the game counted one crossing. Visually, however, the ropes were only free Verlet curves. They could slide through one another and did not feel physically tied together.

That made the game read as "move colored chords around a circle" rather than "untie a real bundle of ropes."

## New model

The game now has two layers that agree with each other.

### 1. Logical knot graph

Every alternating rope pair becomes one logical knot.

A knot remains active while those two ropes are topologically crossed according to the peg order. When moving one peg into the single empty socket changes that topology, the knot is released.

The level is complete when the logical knot graph is empty.

### 2. Physical knot constraints

Every logical knot is mapped onto interior Verlet particles from both ropes.

The paired particles:
- are coupled around a shared moving knot point;
- have additional local drag/friction;
- keep a stable crossing angle;
- pull nearby rope particles into a small crossed shape instead of collapsing into one point;
- uses one clear physical contact per logical knot, avoiding ambiguous multi-wrap piles while still coupling the two ropes physically.

This means dragging one peg visibly pulls the other rope(s) that are bound into the same tangle. When a logical knot is removed, its physical constraint disappears and the involved ropes relax naturally.

## Player rule

- There is exactly one empty socket.
- A player can only move an occupied peg into that empty socket.
- The old peg position becomes the next empty socket.
- Each move can release, preserve, or create knots.
- The goal is to reach zero knots.

## Visual target

The board should read as a physical tangle without collapsing into a central spaghetti ball:
- thick glossy cords;
- soft cast shadows;
- one clear local over/under contact per logical knot;
- no detached decorative crossing capsules or fake knot dots;
- stable contact locations while the player is not dragging;
- very slow bounded contact sliding only when a bound rope is actively pulled;
- procedural knot density capped so difficult boards stay readable;
- ropes already appear tangled when the level opens.

The board should stay visually simple:
- cream background;
- dark irregular circular board;
- muted unused sockets;
- bright colored pegs and ropes;
- minimal HUD around the board.

## Difficulty

Early levels teach one knot and the single empty-socket rule.

Later levels progressively add:
- more ropes, capped at nine to stay close to the readable physical-puzzle reference;
- more active logical knots, but with a hard launch readability cap;
- connected knot graphs without forcing every contact into the board center;
- longer legal solution paths.

The launch set remains deterministic and automatically checked for solvability.


## Interaction polish

Endpoint dragging uses a spring-follow visual target. The rope therefore develops tension and pulls the rest of its bound tangle instead of teleporting rigidly to the pointer.

Moves that reduce the logical knot count receive stronger haptic feedback and a dedicated release sound. Moves that do not improve the tangle retain the normal move feedback.

The level browser is grouped into five 20-level chapters so difficulty progression is visible rather than presenting one long 100-card list.


## Tangle graph quality

Procedural levels no longer accept any random permutation that merely reaches a crossing count.

Later levels are ranked by the actual knot graph:
- from level 17 onward every rope must participate in the tangle;
- from level 25 onward the knot graph must be connected, so the board behaves like one physical bundle rather than several unrelated mini-puzzles;
- the generator still remains deterministic for repeatable QA and saved progression.

## Sliding contact model

Physical knot centers are readability anchors. They:
- are distributed away from a tiny central pile;
- remain fixed while the player is not interacting;
- may slide only a small capped distance when one of their ropes is actively pulled;
- remain on interior rope particles away from endpoints;
- disappear as one-shot release events when the logical knot is actually removed.

A knot release drives a small visual burst, stronger haptic feedback, and a short positive sound cue.
