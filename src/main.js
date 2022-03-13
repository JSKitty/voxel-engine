
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

// Prepare our textures
const loader = new THREE.TextureLoader();
const textures = {
    'grassTop': loader.load('src/textures/grass-top.png'),
    'grassSide': loader.load('src/textures/grass-side.jpg'),
    'dirt': loader.load('src/textures/dirt.jpg'),
    'stone': loader.load('src/textures/stone.jpg'),
}
// Apply filters, etc!
Object.entries(textures).forEach(tex => {
    tex[1].magFilter = THREE.NearestFilter;
    tex[1].minFilter = THREE.NearestFilter;
});

// Prepare our materials
const materials = {
    'grass': [ // Side
        new THREE.MeshStandardMaterial({ map: textures.grassSide }), // Side
        new THREE.MeshStandardMaterial({ map: textures.grassSide }), // Side
        new THREE.MeshStandardMaterial({ map: textures.grassTop }),  // Top
        new THREE.MeshStandardMaterial({ map: textures.dirt }),      // Bottom
        new THREE.MeshStandardMaterial({ map: textures.grassSide }), // Side
        new THREE.MeshStandardMaterial({ map: textures.grassSide })  // Side
    ],
    'dirt': new THREE.MeshStandardMaterial({ map: textures.dirt }),
    'stone': new THREE.MeshStandardMaterial({ map: textures.stone })
}

// Prepare our geometry and meshes
const blockGeoGlobal = new THREE.BoxGeometry(1, 1, 1);
const blocks = {
    'grass': () => new THREE.Mesh(blockGeoGlobal, materials.grass),
    'dirt': () => new THREE.Mesh(blockGeoGlobal, materials.dirt),
    'stone': () => new THREE.Mesh(blockGeoGlobal, materials.stone),
}

// A three-dimensional world grid
const grid = [[[]]];

function addBlock(x, y, z, blockType) {
    // Sanity: ensure this grid path exists
    if (!grid[x]) grid[x] = [];
    if (!grid[x][y]) grid[x][y] = [];
    // Create a new block instance and assign it
    const mesh = blockType();
    grid[x][y][z] = mesh;
    mesh.position.set(x, y, z);
    // Spawn into the scene!
    scene.add(mesh);
}

function removeBlock(x, y, z) {
    // Sanity: ensure this grid block exists
    if (grid[x] && grid[x][y] && grid[x][y][z]) {
        // Remove from the scene
        scene.remove(grid[x][y][z]);
        // Check for cloned materials and dispose of them
        if (grid[x][y][z].material.length)
            grid[x][y][z].material.forEach(a => a.isCloned && a.dispose());
        else if (grid[x][y][z].material.isCloned)
            grid[x][y][z].material.dispose();
        // Remove from memory and free up it's coordinate
        grid[x][y][z] = undefined;
    }
}

function editBlock(x, y, z, matType) {
    // Sanity: ensure this grid block exists
    if (grid[x] && grid[x][y] && grid[x][y][z]) {
        if (matType.length)
            grid[x][y][z].material = matType.forEach(a => a.clone());
        else
            grid[x][y][z].material = matType.clone();
    }
}

function setBlockColourIntensity(x, y, z, intensity) {
    // Sanity: ensure this grid block exists
    if (grid[x] && grid[x][y] && grid[x][y][z]) {
        const cBlk = grid[x][y][z];
        // Optimization Note:
        // To save A LOT of memory: we'll only deep-clone materials on-demand,
        // we also add a `.isCloned` flag to prevent double-clones in the future!
        // Con: A slight 'hitch' in CPU during re-render of the new materials
        if (cBlk.material.length) {
            // Deep-Clone and reassign materials
            if (!cBlk.material[0].isCloned) {
                cBlk.material = cBlk.material.map(a => a.clone());
                cBlk.material.forEach(a => {
                    a.isCloned = true;
                    // Apply internsity scalar to cloned materials
                    a.color.setScalar(intensity);
                })
            } else {
                // Apply internsity scalar to cloned materials
                cBlk.material.forEach(a => a.color.setScalar(intensity));
            }
        } else {
            // Deep-Clone and reassign material
            if (!cBlk.material.isCloned) {
                cBlk.material = cBlk.material.clone();
                cBlk.material.isCloned = true;
            }
            // Apply internsity scalar to cloned material
            cBlk.material.color.setScalar(intensity);
        }
    }
}

// Generate a simple 'cell' of 8x8x8 blocks
const cellSize = 8;
for (let y = 0; y < cellSize; ++y) {
    for (let z = 0; z < cellSize; ++z) {
        for (let x = 0; x < cellSize; ++x) {
            // Top-level blocks should be grass blocks!
            addBlock(x, y, z, y === cellSize - 1 ? blocks.grass : y <= cellSize - 3 ? blocks.stone : blocks.dirt);
        }
    }
}

// The renderer loop
let fFirstRender = true;
let nLastFrame = Date.now();
const arrFPS = [];
const render = function () {
    // For the first render, initalize some stuff
    if (fFirstRender) {
        fFirstRender = false;
        // Sit the player on-top of the cell
        camera.position.y = cellSize + nPlayerHeight;
        // Setup the FPS counter
        setInterval(() => 
            domStats.innerHTML = Math.round(arrFPS.reduce((a, b) => a + b) / 30) + ' FPS' +
                                 '<br>Draw Calls: ' + renderer.info.render.calls +
                                 '<br>Triangles: ' + renderer.info.render.triangles
        , 250);
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

document.body.addEventListener('click', () => handleClick());

// Fire off the first renderer tick once ALL page elements are loaded
window.onload = () => render();

// If the page/screen size changes, make sure to adjust the rendering too!
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}