// A volume-sorted array of water voxels to track
const arrWaterVoxels = [];

// Global absorption rate
const nAbsorbtionRate = 0.00005;

// A loopable function which starts a 'tick' of water simulation
function simulateWaterTick() {
    // First, ensure a consistent order of water simulation (larger volumes are simulated first / in priority)
    arrWaterVoxels.sort((a, b) => b.userData.nVolume - a.userData.nVolume);

    for (const cWater of arrWaterVoxels) {
        // All water voxels are slowly dissipated over time
        cWater.userData.nVolume -= nAbsorbtionRate;
        const nY = Math.round(cWater.position.y);
        // If volume is too low, or there's no solid block below, destroy this water voxel!
        if (cWater.userData.nVolume < 0.001 || !isSolidBlockHere(cWater.position.x, nY - 1, cWater.position.z)) {
            removeBlock(cWater.position.x, Math.round(cWater.position.y), cWater.position.z);
            arrWaterVoxels.splice(arrWaterVoxels.findIndex(a => a === cWater), 1);
            continue;
        }
        // Check if, and where, there's any water voxels next to this one.
        const cNeighbours = getWaterNeighbours(cWater.position.x, nY, cWater.position.z);
        for (const cNeighbour of cNeighbours) {
            if (!cNeighbour.blk) {
                // No neighbour! Let's see if it's occupied by non-water.
                if (isBlockHere(cNeighbour.coords.x, cNeighbour.coords.y, cNeighbour.coords.z)) {
                    // Yep! We can skip this path then.
                    continue;
                } else {
                    // Nope! Now let's check for a floor
                    if (cWater.userData.nVolume < 0.01) continue;
                    for (let newY = cNeighbour.coords.y; newY >= cNeighbour.coords.y - 3; newY--) {
                        const cFloor = getBlock(cNeighbour.coords.x, newY, cNeighbour.coords.z);
                        if (cFloor) {
                            // Found a floor! Is it water already?
                            if (cFloor.userData.fWater) {
                                // Low-Y axis Water Neighbour found! Transfer at a faster rate, and without volume limit
                                const nTransfer = Math.max(cWater.userData.nVolume * 0.1, 0.005);
                                cFloor.userData.nVolume += nTransfer;
                                cWater.userData.nVolume -= nTransfer;
                            } else {
                                // Nope! Time to generate some!
                                const cNewWater = addBlock(cNeighbour.coords.x,
                                    newY + 1,
                                    cNeighbour.coords.z,
                                    blocks.water
                                );
                                if (cNewWater) {
                                    arrWaterVoxels.push(cNewWater);
                                    const nTransfer = Math.max(cWater.userData.nVolume * 0.02, 0.005);
                                    cNewWater.userData.nVolume += nTransfer;
                                    cWater.userData.nVolume -= nTransfer;
                                }
                            }
                        }
                    }
                }
            } else {
                // Water Neighbour found! If it has less volume than us, transfer some!
                if (cNeighbour.blk.userData.nVolume < cWater.userData.nVolume) {
                    const nTransfer = cWater.userData.nVolume * 0.05;
                    cNeighbour.blk.userData.nVolume += nTransfer;
                    cWater.userData.nVolume -= nTransfer;
                }
            }
        }
        // Lastly, we set the geometry values of our water voxels to match their volumes!
        cWater.scale.y = cWater.userData.nVolume;
        // The Y-position of the water is equal to the remainder of it's block-height-ratio, divided by two.
        // ... rounding is used as a cheap way to keep blocks from 'sinking' over loops. TODO: Improve this!
        cWater.position.y = nY - ((1 - cWater.userData.nVolume) / 2);
        // Now we adjust opacity to meet it, since super shallow water should be less visible
        setBlockOpacity(cWater.position.x, nY, cWater.position.z, Math.min(cWater.userData.nVolume, 1));
    }
    // Water ticks are processed at a maximum of every 50ms (after processing times)
    setTimeout(simulateWaterTick, 50);
}

// A function to determine surrounding water bodies
function getWaterNeighbours(x, y, z) {
    return [
        {
            blk: getBlock(x + 1, y, z, blocks.water),
            coords: {x: x + 1, y, z}
        },
        {
            blk: getBlock(x - 1, y, z, blocks.water),
            coords: {x: x - 1, y, z}
        },
        {
            blk: getBlock(x, y, z + 1, blocks.water),
            coords: {x: x, y, z: z + 1}
        },
        {
            blk: getBlock(x, y, z - 1, blocks.water),
            coords: {x: x, y, z: z - 1}
        }
    ]
}