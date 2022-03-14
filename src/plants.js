// The constants of nature!
const nMaxTreeHeight = 8;
const nMinTreeHeight = 4;

function getRandomOddWidth() {
    // TODO: surely a better way to do this?
    while (true) {
        const num = Math.max(2, Math.round(Math.random() * 5));
        if (num % 2 === 1) return num;
    }
}

function getOddOffset(n) {
    // Count the 'evens' prior to the odd to find the offset
    // TODO: find a more efficient way, this sucks!
    let offset = 0;
    let i = 0;
    while (true) {
        if (++i % 2 === 0) ++offset;
        if (i === n) return offset;
    }
}

function addTree(x, y, z) {
    // First, generate a randomized height, making sure to not intrude existing blocks
    const nHeight = Math.floor(nMinTreeHeight + (Math.random() * (nMaxTreeHeight - nMinTreeHeight)));
    // Start generating the full trunk + branches until either the max height, or we hit a ceiling
    let i = 0;
    for (i; i<nHeight; ++i) {
        if (addBlock(x, y + i, z, blocks.oak)) {
            if (i > Math.round(nHeight / 2)) {
                const nWidth = getRandomOddWidth();
                // Generate branches at the halfway height, with their size based on the tree height
                let iX = 0, iY = 0, iZ = 0;
                for (iX = 0; iX < nWidth; ++iX) {
                    for (iY = 0; iY < nWidth; ++iY) {
                        for (iZ = 0; iZ < nWidth; ++iZ) {
                            // Randomly leave a couple branches out, no tree is perfect!
                            if (Math.random() < 0.85)
                                addBlock(x + iX - getOddOffset(nWidth), y + i + iY, z + iZ - getOddOffset(nWidth), blocks.leaves);
                        }
                    }
                }
            }
        } else {
            // We reached a ceiling! Run the same branch logic anyway, leaves will fit wherever they can.
            const nWidth = getRandomOddWidth();
            let iX = 0, iY = 0, iZ = 0;
            for (iX = 0; iX < nWidth; ++iX) {
                for (iY = 0; iY < nWidth; ++iY) {
                    for (iZ = 0; iZ < nWidth; ++iZ) {
                        if (Math.random() < 0.85)
                            addBlock(x + iX - getOddOffset(nWidth), y + i + iY, z + iZ - getOddOffset(nWidth), blocks.leaves);
                    }
                }
            }
            break;
        }
    }
}