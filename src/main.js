
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// White directional light used as 'sunlight'
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Ambient lighting used to prevent total black-out for unlit faces
const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

// Setup the camera
camera.position.x = 5;
camera.position.z = 5;

// Setup some basic world constants
const cellHeight = 3;
const cellWidth = 18;

// The renderer loop
let fFirstRender = true;
let nLastFrame = Date.now();
const arrFPS = [];
const render = function () {
    // For the first render, initalize some stuff
    if (fFirstRender) {
        fFirstRender = false;
        // Generate a simple 'cell' of 8x8x8 blocks
        for (let y = 0; y < cellHeight; ++y) {
            for (let z = 0; z < cellWidth; ++z) {
                for (let x = 0; x < cellWidth; ++x) {
                    // Top-level blocks should be grass blocks!
                    addBlock(x, y, z, y === cellHeight - 1 ? blocks.grass : y <= cellHeight - 3 ? blocks.stone : blocks.dirt);
                }
            }
        }
        // Sit the player on-top of the cell
        camera.position.y = cellHeight + nPlayerHeight;
        // Spawn a forest!
        const nTrees = Math.random() * 15;
        for (let i = 0; i<nTrees; i++)
            addTree(Math.round(Math.random() * cellWidth), cellHeight, Math.round(Math.random() * cellWidth));
        // Setup the FPS counter
        setInterval(() =>
            domStats.innerHTML = Math.round(arrFPS.reduce((a, b) => a + b) / 30) + ' FPS' +
                                 '<br>Draw Calls: ' + renderer.info.render.calls +
                                 '<br>Triangles: ' + renderer.info.render.triangles
        , 250);
        // Lastly, perform an initially-expensive optimization run by hiding meshes that have no visible faces.
        checkWorldVisibility();

        simulateWaterTick();
    }

    // Execute any key presses. holds, etc.
    runPressedButtons();

    // Check for any objects in view, highlighting and selecting in-advance, if possible.
    checkObjectsInView();

    // Check for + execute physical collisions
    checkPlayerPhysics();

    // Render the scene
    renderer.render(scene, camera);
    
    // Calculate and display engine stats
    arrFPS.unshift(Math.round(1000 / (Date.now() - nLastFrame)));
    if (arrFPS.length > 30) arrFPS.pop();
    nLastFrame = Date.now();

    // Queue another frame!
    requestAnimationFrame(render);
};

// Keep track of player states
const cObjectInView = {
    distance: 0,
    object: {}
}

function handleClick() {
    if (cObjectInView.distance > 0 && cObjectInView.distance <= 3) {
        // Nuke that block!
        removeBlock(cObjectInView.object.position.x,
                    cObjectInView.object.position.y,
                    cObjectInView.object.position.z
        );
    }
}

function placeBlock() {
    if (cObjectInView.distance > 0 && cObjectInView.distance <= 3) {
        // Add a block on top!
        const cBlock = addBlock(cObjectInView.object.position.x,
                    cObjectInView.object.position.y + 1,
                    cObjectInView.object.position.z,
                    blocks.water
        );
        if (!cBlock) return; 
        cBlock.userData.nVolume = 1;
    }
}

document.body.addEventListener('click', () => {
    handleClick();
    controls.lock();
});

// Fire off the first renderer tick once ALL page elements are loaded
window.onload = () => render();

// If the page/screen size changes, make sure to adjust the rendering too!
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}