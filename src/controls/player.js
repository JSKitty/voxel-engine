// The player's reach, in blocks (meters).
const nPlayerReach = 4;

// The player's height, in blocks (meters).
const nPlayerHeight = 1.62;

// The rate of falling, in blocks.
// TODO: change to a gravity formula function, with acceleration, etc.
let nFallSpeed = 0.075;

// A flag to use the 'editor camera' or physics-based 'player camera'
let fUsePhysicalPlayer = true;

function checkObjectsInView() {
    // Prevent accidently hitting things when locking the cursor
    if (controls.isLocked === false) return;
    // Raycast from the camera face
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects[0]) {
        if (cObjectInView.distance) {
            // Remove highlight from previous block
            setBlockColourIntensity(cObjectInView.object.position.x,
                                    cObjectInView.object.position.y,
                                    cObjectInView.object.position.z,
                                    1);
         }
        cObjectInView.distance = intersects[0].distance;
        cObjectInView.object = intersects[0].object;
        if (cObjectInView.distance > 0 && cObjectInView.distance <= 3) {
        // Visually highlight this block
        setBlockColourIntensity(cObjectInView.object.position.x,
                                cObjectInView.object.position.y,
                                cObjectInView.object.position.z,
                                0.75);
        }
    } else {
        if (cObjectInView.distance) {
            // Remove highlight from previous block
            setBlockColourIntensity(cObjectInView.object.position.x,
                                    cObjectInView.object.position.y,
                                    cObjectInView.object.position.z,
                                    1);
         }
        cObjectInView.distance = 0;
        cObjectInView.object = {};
    }
}

function checkPlayerPhysics() {
    if (!fUsePhysicalPlayer) return;
    // Enforce gravity by giving a constant downwards force *unless* a floor is below us
    const raycaster = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0));
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects[0]) {
        // Note: We give an 0.001 'buffer' due to (lack of) float precision
        // Fall towards the floor! Or just stand on it, that works too.
        if (intersects[0].distance - 0.001 >= nPlayerHeight)
            camera.position.y -= nFallSpeed;
        else
            // Also make sure we don't accidently fall partially 'into' the floor.
            camera.position.y = intersects[0].point.y + nPlayerHeight;
    } else {
        // TODO: later down the line, we should instead teleport the player 'on land'
        // ... but for now, we'll just let them fall for eternity. :D
        camera.position.y -= nFallSpeed;
    }
}