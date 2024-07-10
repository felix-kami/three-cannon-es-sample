import * as THREE from "three";
import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as CANNON from "cannon-es";
import CannonDebugRenderer from "CannonDebugRenderer";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { threeToCannon, ShapeType } from "three-to-cannon";

const scene = new THREE.Scene();

const light = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(light);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-30, 3, -15);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.y = 0.5;

const world = new CANNON.World();
world.gravity.set(0, -9.8, 0);

const normalMaterial = new THREE.MeshNormalMaterial();
const phongMaterial = new THREE.MeshPhongMaterial();

const sphereGeometry = new THREE.SphereGeometry();
const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
sphereMesh.position.x = -2;
sphereMesh.position.y = 1;
sphereMesh.castShadow = true;
scene.add(sphereMesh);

const sphereShape = new CANNON.Sphere(1);
const sphereBody = new CANNON.Body({
  mass: 0,
});
sphereBody.addShape(sphereShape);
sphereBody.position.x = sphereMesh.position.x;
sphereBody.position.y = sphereMesh.position.y;
sphereBody.position.z = sphereMesh.position.z;
world.addBody(sphereBody);

let monkeyLoaded = false;
let monkeyLoaded2 = false;

let monkeyBody;
let monkeyMesh;

let monkeyMesh2;
let monkeyBody2;

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  "http://192.168.88.74:3000/objs/cube.gltf",
  (gltf) => {
    let vertices = [];
    monkeyMesh2 = gltf.scene;
    scene.add(monkeyMesh2);

    monkeyMesh2.traverse((child) => {
      if (child.isMesh) {
        child.material = normalMaterial;
        vertices = vertices.concat(child.geometry.attributes.position.array);
      }
    });

    monkeyMesh2.position.x = -2;
    monkeyMesh2.position.y = 10;
    monkeyMesh2.position.z = 0;
    monkeyMesh2.scale.set(1.5, 1.5, 1.5);

    const { shape } = threeToCannon(monkeyMesh2, { type: ShapeType.MESH });
    shape.scale.set(1.5, 1.5, 1.5);
    monkeyBody2 = new CANNON.Body({ mass: 1 });
    monkeyBody2.addShape(shape);
    monkeyBody2.position.x = monkeyMesh2.position.x;
    monkeyBody2.position.y = monkeyMesh2.position.y;
    monkeyBody2.position.z = monkeyMesh2.position.z;
    world.addBody(monkeyBody2);
    monkeyLoaded2 = true;

    // Thêm sự kiện va chạm cho monkeyBody2
    monkeyBody2.addEventListener("collide", onCollide);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

const objLoader = new OBJLoader();
objLoader.load(
  "http://192.168.88.74:3000/objs/teapot.obj",
  (monkeyMesh1) => {
    scene.add(monkeyMesh1);
    monkeyMesh1.traverse((child) => {
      if (child.isMesh) {
        child.material = normalMaterial;
      }
    });

    monkeyMesh = monkeyMesh1;

    monkeyMesh.position.x = 0;
    monkeyMesh.position.y = 50;
    monkeyMesh.position.z = -2;
    monkeyMesh.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      Math.PI / 2
    );

    monkeyMesh.scale.set(0.2, 0.2, 0.2);

    const { shape } = threeToCannon(monkeyMesh1, { type: ShapeType.MESH });
    shape.scale.set(0.2, 0.2, 0.2);
    monkeyBody = new CANNON.Body({ mass: 1 });
    monkeyBody.addShape(shape);
    monkeyBody.position.x = monkeyMesh.position.x;
    monkeyBody.position.y = monkeyMesh.position.y;
    monkeyBody.position.z = monkeyMesh.position.z;
    monkeyBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      Math.PI / 2
    );
    world.addBody(monkeyBody);
    monkeyLoaded = true;

    // Thêm sự kiện va chạm cho monkeyBody
    monkeyBody.addEventListener("collide", onCollide);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.log("An error happened", error);
  }
);

const planeGeometry = new THREE.PlaneGeometry(25, 25);
const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
planeMesh.position.y = -0.01;
planeMesh.rotateX(-Math.PI / 2);
planeMesh.receiveShadow = true;
scene.add(planeMesh);
const planeShape = new CANNON.Plane();
const planeBody = new CANNON.Body({
  mass: 0,
});
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody);

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

const clock = new THREE.Clock();
let delta;

const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

function onCollide(event) {
    console.log('Collide', event);
  const contact = event.contact;
  const bodyA = contact.bi;
  const bodyB = contact.bj;
  bodyA.velocity.set(0, 0, 0);
  bodyA.angularVelocity.set(0, 0, 0);
  bodyA.mass = 0;
  bodyA.updateMassProperties();

  bodyB.velocity.set(0, 0, 0);
  bodyB.angularVelocity.set(0, 0, 0);
  bodyB.mass = 0;
  bodyB.updateMassProperties();

//   if (bodyA === monkeyBody || bodyB === monkeyBody || bodyA === monkeyBody2 || bodyB === monkeyBody2) {
//     if (bodyA.mass !== 0) {
//       bodyA.velocity.set(0, 0, 0);
//       bodyA.angularVelocity.set(0, 0, 0);
//       bodyA.mass = 0;
//       bodyA.updateMassProperties();
//     }
//     if (bodyB.mass !== 0) {
//       bodyB.velocity.set(0, 0, 0);
//       bodyB.angularVelocity.set(0, 0, 0);
//       bodyB.mass = 0;
//       bodyB.updateMassProperties();
//     }
//   }
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  delta = Math.min(clock.getDelta(), 0.1);
  world.step(delta);

  cannonDebugRenderer.update();

  sphereMesh.position.set(
    sphereBody.position.x,
    sphereBody.position.y,
    sphereBody.position.z
  );
  sphereMesh.quaternion.set(
    sphereBody.quaternion.x,
    sphereBody.quaternion.y,
    sphereBody.quaternion.z,
    sphereBody.quaternion.w
  );

  if (monkeyLoaded) {
    monkeyMesh.position.set(
      monkeyBody.position.x,
      monkeyBody.position.y,
      monkeyBody.position.z
    );
    monkeyMesh.quaternion.set(
      monkeyBody.quaternion.x,
      monkeyBody.quaternion.y,
      monkeyBody.quaternion.z,
      monkeyBody.quaternion.w
    );
  }

  if (monkeyLoaded2) {
    monkeyMesh2.position.set(
      monkeyBody2.position.x,
      monkeyBody2.position.y,
      monkeyBody2.position.z
    );
    monkeyMesh2.quaternion.set(
      monkeyBody2.quaternion.x,
      monkeyBody2.quaternion.y,
      monkeyBody2.quaternion.z,
      monkeyBody2.quaternion.w
    );
  }

  render();
}

function render() {
  renderer.render(scene, camera);
}

animate();