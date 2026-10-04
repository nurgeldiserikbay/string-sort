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
- pull nearby rope particles into a small crossed shape instead of collapsing into one point.

This means dragging one peg visibly pulls the other rope(s) that are bound into the same tangle. When a logical knot is removed, its physical constraint disappears and the involved ropes relax naturally.

## Player rule

- There is exactly one empty socket.
- A player can only move an occupied peg into that empty socket.
- The old peg position becomes the next empty socket.
- Each move can release, preserve, or create knots.
- The goal is to reach zero knots.

## Visual target

The center of the board should look like a compact physical bundle:
- thick glossy cords;
- soft cast shadows;
- no artificial "capsule" redraw at crossings;
- local crossed shapes around real knot constraints;
- no animated dashed seam;
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
- more ropes;
- more active logical knots;
- denser central knot graphs;
- longer legal solution paths.

The launch set remains deterministic and automatically checked for solvability.
