
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 0.1, 1000);

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
camera.position.x = 10;
camera.position.z = 15;
camera.position.y = 10;
camera.lookAt(scene.position);

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
    'grass': () => new THREE.Mesh(blockGeoGlobal, materials.grass.map(a => a.clone())),
    'dirt': () => new THREE.Mesh(blockGeoGlobal, materials.dirt.clone()),
    'stone': () => new THREE.Mesh(blockGeoGlobal, materials.stone.clone()),
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
        // Remove from memory and free up it's coordinate
        grid[x][y][z] = undefined;
    }
}

function editBlock(x, y, z, matType) {
    // Sanity: ensure this grid block exists
    if (grid[x] && grid[x][y] && grid[x][y][z]) {
        grid[x][y][z].material = matType;
    }
}

function setBlockColourIntensity(x, y, z, intensity) {
    // Sanity: ensure this grid block exists
    if (grid[x] && grid[x][y] && grid[x][y][z]) {
        if (grid[x][y][z].material.length)
            grid[x][y][z].material.forEach(a => a.color.setScalar(intensity));
        else
            grid[x][y][z].material.color.setScalar(intensity);
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
const render = function () {
    runPressedButtons();
    requestAnimationFrame(render);

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

    renderer.render(scene, camera);
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