
/* Bindings */
const controller = {
    'w': {pressed: false, func: camForwards},
    'a': {pressed: false, func: camLeft},
    's': {pressed: false, func: camBackwards},
    'd': {pressed: false, func: camRight}
}

/* Movement Controls */
const camDir = new THREE.Vector3();
function camForwards() {
	camera.getWorldDirection(camDir);
    // Remove 'flying' capability from physical player
    if (fUsePhysicalPlayer) camDir.y = 0;
	camera.position.addScaledVector(camDir, 0.1);
}

function camBackwards() {
	camera.getWorldDirection(camDir);
    // Remove 'flying' capability from physical player
    if (fUsePhysicalPlayer) camDir.y = 0;
	camera.position.addScaledVector(camDir, -0.1);
}

function camLeft() {
    camera.translateX(-0.1);
}

function camRight() {
    camera.translateX(0.1);
}


/* Key Event Handlers */
const handleKeyDown = (e) => {
    controller[e.key] && (controller[e.key].pressed = true)
}

const handleKeyUp = (e) => {
    controller[e.key] && (controller[e.key].pressed = false)
}

const runPressedButtons = () => {
    Object.keys(controller).forEach(key => {
        controller[key].pressed && controller[key].func()
    })
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);