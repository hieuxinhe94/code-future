/*
  variable declaration:
*/
var scene;
var camera;
var renderer;
var joystick;
var joystickControl = {
  forward: 0,
  turn: 0
};
var followCam;
var modifier, cloth;
var check;
var groundMaterial, wheelMaterial, wheelGroundContactMaterial;
const helper = new CannonHelper(scene);
const physics = {};
var plane;
/*
  Init
*/

init();
animate();


/* Function */

function init() {
  scene = new THREE.Scene();

  setupMainCamera();

  ensureRenderer();

  createWorld();

  createPlan();

  /* Render in DOM */
  document.body.appendChild(renderer.domElement);

  joystick = new JoyStick({
    onMove: joystickCallback
  });

  // Init listeners
  window.addEventListener('resize', onWindowResize);
}

function setupMainCamera() {
  // Camera dựa theo góc nhìn cá nhân - human
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .01, 100000);
  camera.position.set(1, 1, -1);
  camera.lookAt(scene.position);
}

function ensureRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMapSoft = true; // Shadow
  renderer.shadowMapType = THREE.PCFShadowMap; //Shadow
}

function createWorld() {
  world = new CANNON.World();

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.gravity.set(0, -10, 0);
  world.defaultContactMaterial.friction = 0;
}

function createPlan() {
  var texture = new THREE.TextureLoader().load('./assets/vr-debate-e1475603418440.webp');
  plane = new THREE.Mesh(new THREE.PlaneGeometry(600, 430, 20, 20, true), new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide
  }));
  plane.scale.set(.0025, .0025, .0025);
  plane.position.set(0, 1.5, 0);
  plane.position.x = .75;
  plane.castShadow = true;
}

function addMaterial() {
  groundMaterial = new CANNON.Material("groundMaterial");
  wheelMaterial = new CANNON.Material("wheelMaterial");
  wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
    friction: 0,
    restitution: 0,
    contactEquationStiffness: 1000
  });
}

/* Helper function */

function onWindowResize() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}


/* Observer functions */

function joystickCallback(forward, turn) {
  joystickControl.forward = forward;
  joystickControl.turn = -turn;
}

function updateCamera() {
  if (followCam) {
    camera.position.lerp(followCam.getWorldPosition(new THREE.Vector3()), 0.05);
    camera.lookAt(mesh.position.x, mesh.position.y + .5, mesh.position.z);
  }
}



/* Binding functions */
function animate() {
  requestAnimationFrame(animate);
  updateCamera();

  render();

  addDebug();
}


function render() {
  renderer.render(scene, camera);
}


function addModifier(mesh) {
  modifier = new ModifierStack(mesh);
  cloth = new Cloth(3, 0);
  cloth.setForce(0.2, -0.2, -0.2);
}

function addDebug() {
  addModifier(plane);
  modifier.addModifier(cloth);
  cloth.lockXMin(0);
}

function runDebug() {
  //let delta = clock.getDelta();
  //mixers.map(x => x.update(delta));

  /* cannon */
  const now = Date.now();
  if (lastTime === undefined) lastTime = now;
  const dt = (Date.now() - lastTime) / 1000.0;
  var FPSFactor = dt;
  lastTime = now;

  world.step(fixedTimeStep, dt);
  helper.updateBodies(world);

  if (check) check();

  // display coordinates
  info.innerHTML = `<span>X: </span>${mesh.position.x.toFixed(2)}, &nbsp;&nbsp;&nbsp; <span>Y: </span>${mesh.position.y.toFixed(2)}, &nbsp;&nbsp;&nbsp; <span>Z: </span>${mesh.position.z.toFixed(2)}`

  // flag
  modifier && modifier.apply();
}