// Prepare our textures
const loader = new THREE.TextureLoader();
const textures = {
    'oakSide': loader.load('src/textures/oak-bark.jpg'),
    'oakMiddle': loader.load('src/textures/oak-inner.jpg'),
    'leaves': loader.load('src/textures/leaves.png'),
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
    'oak': [ // Side
        new THREE.MeshStandardMaterial({ map: textures.oakSide }),   // Side
        new THREE.MeshStandardMaterial({ map: textures.oakSide }),   // Side
        new THREE.MeshStandardMaterial({ map: textures.oakMiddle }), // Top
        new THREE.MeshStandardMaterial({ map: textures.oakMiddle }), // Bottom
        new THREE.MeshStandardMaterial({ map: textures.oakSide }),   // Side
        new THREE.MeshStandardMaterial({ map: textures.oakSide })    // Side
    ],
    'leaves': new THREE.MeshStandardMaterial({ map: textures.leaves }),
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

// Set properties for 'unique' blocks, like transparent leaves, glass, etc
materials.leaves.transparent = true;
materials.leaves.alphaTest = 1;

// Prepare our geometry and meshes
const blockGeoGlobal = new THREE.BoxGeometry(1, 1, 1);
const blocks = {
    'oak': () => new THREE.Mesh(blockGeoGlobal, materials.oak),
    'leaves': () => new THREE.Mesh(blockGeoGlobal, materials.leaves),
    'grass': () => new THREE.Mesh(blockGeoGlobal, materials.grass),
    'dirt': () => new THREE.Mesh(blockGeoGlobal, materials.dirt),
    'stone': () => new THREE.Mesh(blockGeoGlobal, materials.stone),
}

// A three-dimensional world grid
const grid = [[[]]];

function addBlock(x, y, z, blockType) {
    // Sanity: ensure this grid path exists and is not already assigned
    if (!grid[x]) grid[x] = [];
    if (!grid[x][y]) grid[x][y] = [];
    if (grid[x][y][z]) return null;
    // Create a new block instance and assign it
    const mesh = blockType();
    grid[x][y][z] = mesh;
    mesh.position.set(x, y, z);
    // Spawn into the scene!
    scene.add(mesh);
    return mesh;
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