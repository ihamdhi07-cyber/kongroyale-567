// A single stationary guide, built from temporary procedural geometry.
import * as THREE from "three";
import { heightAt } from "../world.js";
export const GUIDE = Object.freeze({ x: 6, z: 5, name: "Mira" });
export function createGuide(scene) {
  const group = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({
    color: "#778a76",
    roughness: 0.9,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: "#cfa487",
    roughness: 1,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.9, 4, 8), coat);
  body.position.y = 1.65;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), skin);
  head.position.y = 2.65;
  group.add(head);
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.42, 8),
    new THREE.MeshStandardMaterial({ color: "#5d6750" }),
  );
  hat.position.y = 3.03;
  group.add(hat);
  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.8, 0.4),
    new THREE.MeshStandardMaterial({ color: "#514d3d" }),
  );
  legs.position.y = 0.52;
  group.add(legs);
  group.position.set(GUIDE.x, heightAt(GUIDE.x, GUIDE.z), GUIDE.z);
  group.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  scene.add(group);
  return group;
}
export function guideMessage(discovered, lantern, restored) {
  if (restored)
    return "The old light is shining again. Thank you for looking after this place.";
  if (lantern)
    return "That light is ready. Take it to the waystone in the clearing.";
  if (discovered)
    return "Look for the pale green glowleaves around the clearing. Three will make a light.";
  return "The old waystone is down the path, beneath a golden light. It has a story to tell.";
}
