// Rapier owns the prototype's static terrain, obstacles and kinematic player.
import RAPIER from "@dimforge/rapier3d-compat";

const PLAYER_CENTER = 1.02;
export async function createPhysics(geometry, start) {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  function addTerrain(terrain) {
    const vertices = new Float32Array(terrain.attributes.position.array);
    const indices = new Uint32Array(terrain.index.array);
    return world.createCollider(RAPIER.ColliderDesc.trimesh(vertices, indices));
  }
  if (geometry) addTerrain(geometry);
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      start.x,
      start.y + PLAYER_CENTER,
      start.z,
    ),
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(0.55, 0.45),
    body,
  );
  const controller = world.createCharacterController(0.02);
  controller.enableSnapToGround(0.25);
  controller.setMaxSlopeClimbAngle(Math.PI / 4);
  controller.setMinSlopeSlideAngle(Math.PI / 3);
  let verticalVelocity = 0;
  let grounded = false;
  // Update Rapier's query structures before the first controller query.
  world.step();
  return {
    addTerrain,
    removeTerrain(terrainCollider) {
      world.removeCollider(terrainCollider, true);
    },
    addCylinder(x, y, z, radius, height) {
      world.createCollider(
        RAPIER.ColliderDesc.cylinder(height / 2, radius).setTranslation(
          x,
          y + height / 2,
          z,
        ),
      );
    },
    sync() {
      world.step();
    },
    move(dx, dz, dt, wantsJump, swimFeetY = null) {
      const swimming = swimFeetY !== null;
      if (swimming) {
        // Buoyancy gently converges on the waterline while preserving collision against banks.
        verticalVelocity = Math.max(
          -3,
          Math.min(3, (swimFeetY - (body.translation().y - PLAYER_CENTER)) * 5),
        );
      } else {
        if (wantsJump && grounded) verticalVelocity = 8;
        verticalVelocity -= 20 * dt;
      }
      controller.computeColliderMovement(collider, {
        x: dx,
        y: verticalVelocity * dt,
        z: dz,
      });
      const movement = controller.computedMovement();
      grounded = controller.computedGrounded();
      if (grounded && verticalVelocity < 0) verticalVelocity = 0;
      const p = body.translation();
      body.setNextKinematicTranslation({
        x: p.x + movement.x,
        y: p.y + movement.y,
        z: p.z + movement.z,
      });
      world.timestep = dt;
      world.step();
      const next = body.translation();
      return { x: next.x, y: next.y - PLAYER_CENTER, z: next.z, grounded };
    },
    teleport(x, y, z) {
      body.setTranslation({ x, y: y + PLAYER_CENTER, z }, true);
      body.setNextKinematicTranslation({ x, y: y + PLAYER_CENTER, z });
      verticalVelocity = 0;
      grounded = false;
      world.step();
    },
    cameraDistance(origin, direction, maxDistance) {
      const ray = new RAPIER.Ray(origin, direction);
      const hit = world.castRay(
        ray,
        maxDistance,
        true,
        undefined,
        undefined,
        collider,
        body,
      );
      return hit ? Math.max(0.5, hit.timeOfImpact - 0.3) : maxDistance;
    },
    dispose() {
      world.free();
    },
  };
}
