function addTree(x, y, z) {
    // Sanity: ensure this grid path exists
    if (!grid[x]) grid[x] = [];
    if (!grid[x][y]) grid[x][y] = [];
    // First, generate a randomized height, making sure to not intrude existing blocks
    const treeBase = addBlock(x, y, z, blocks.oak);
}