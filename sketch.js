let fontRegular;
let playButton, resetButton, instructionsButton, sphereLayerButton, labelButton, rotateElectronsButton;
let titleDiv, footerDiv, instructionsPopup;
let atoms = [];
let state = "idle";
let progress = 0;
let transferProgress = 0;
let finalProgress = 0;
let transferringElectrons = [];
let showSphereLayer = false;
let showLabels = true;
let rotateElectrons = true;
let flickerAlpha = 0;
let cylinderAlpha = 0;
let cylinderCreated = false;

// Tham số cho khoảng cách chuyển động (giảm tỉ lệ 50%)
const scaleFactor = 0.5;
const baseRadius = 50 * scaleFactor;
const radiusIncrement = 40 * scaleFactor;
const naOuterRadius = baseRadius + 2 * radiusIncrement;
const oOuterRadius = baseRadius + 1 * radiusIncrement;
const initialShellGap = 100 * scaleFactor;
const transferShellGap = 20 * scaleFactor;
const finalShellGap = 10 * scaleFactor;

const initialDistance = naOuterRadius + initialShellGap + oOuterRadius;

const transferTriggerDistance = naOuterRadius + transferShellGap + oOuterRadius;
const finalDistance = naOuterRadius + finalShellGap + oOuterRadius;
const outermostShellRadiusO = baseRadius + 1 * radiusIncrement;

const naIonRadius = baseRadius + 1 * radiusIncrement;
const oIonRadius = baseRadius + 1 * radiusIncrement;

let startPos1, endPos1, controlPoint1_1, controlPoint2_1;
let startPos2, endPos2, controlPoint1_2, controlPoint2_2;

let panX = 0;
let panY = 0;

// --- Constants learned from file 1, applied here ---
// Nucleus radius for offsetting 3D labels toward the viewer
const NUCLEUS_RADIUS = 20 * scaleFactor;
// Label offset and small rotation/offset for improved 3D placement
const LABEL_OFFSET_EXTRA = 1.0 * scaleFactor;
const LABEL_ROTATION_MAG = 0.05;
const ORBIT_RADIUS = 5 * scaleFactor;
// ----------------------------------------------------

function preload() {
    fontRegular = loadFont('https://fonts.gstatic.com/s/opensans/v27/mem8YaGs126MiZpBA-UFVZ0e.ttf');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    perspective(PI / 3, width / height, 0.1, 4000);
    smooth();
    textFont(fontRegular);
    textAlign(CENTER, CENTER);
    noStroke();

    titleDiv = createDiv("MÔ PHỎNG LIÊN KẾT ION GIỮA Na và O");
    titleDiv.style("position", "absolute");
    titleDiv.style("top", "10px");
    titleDiv.style("width", "100%");
    titleDiv.style("text-align", "center");
    titleDiv.style("font-size", "18px");
    titleDiv.style("color", "#fff");
    titleDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
    titleDiv.style("font-family", "Arial");

    footerDiv = createDiv("© HÓA HỌC ABC");
    footerDiv.style("position", "absolute");
    footerDiv.style("bottom", "10px");
    footerDiv.style("width", "100%");
    footerDiv.style("text-align", "center");
    footerDiv.style("font-size", "16px");
    footerDiv.style("color", "#fff");
    footerDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
    footerDiv.style("font-family", "Arial");

    createUI();
    resetSimulation();
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOutCubic(t) {
    let t1 = t - 1;
    return t1 * t1 * t1 + 1;
}

function createUI() {
    playButton = createButton("▶ Play");
    styleButton(playButton);
    setupButtonEffects(playButton, () => {
        if (state === "idle") {
            state = "animating";
        }
    });

    rotateElectronsButton = createButton("Tắt quay electron");
    styleButton(rotateElectronsButton);
    setupButtonEffects(rotateElectronsButton, () => {
        rotateElectrons = !rotateElectrons;
        if (rotateElectrons) {
            rotateElectronsButton.html("Tắt quay electron");
        } else {
            rotateElectronsButton.html("Bật quay electron");
        }
    });

    sphereLayerButton = createButton("Bật lớp cầu");
    styleButton(sphereLayerButton);
    setupButtonEffects(sphereLayerButton, () => {
        showSphereLayer = !showSphereLayer;
        if (showSphereLayer) {
            sphereLayerButton.html("Tắt lớp cầu");
        } else {
            sphereLayerButton.html("Bật lớp cầu");
        }
    });

    labelButton = createButton("Tắt nhãn");
    styleButton(labelButton);
    setupButtonEffects(labelButton, () => {
        showLabels = !showLabels;
        if (showLabels) {
            labelButton.html("Tắt nhãn");
        } else {
            labelButton.html("Bật nhãn");
        }
    });

    resetButton = createButton("↺ Reset");
    styleButton(resetButton);
    setupButtonEffects(resetButton, resetSimulation);

    instructionsButton = createButton("Hướng dẫn");
    styleButton(instructionsButton, true);
    instructionsButton.mousePressed(() => {
        instructionsPopup.style('display', 'block');
    });

    instructionsPopup = createDiv();
    instructionsPopup.id('instructions-popup');
    instructionsPopup.style('position', 'fixed');
    instructionsPopup.style('top', '50%');
    instructionsPopup.style('left', '50%');
    instructionsPopup.style('transform', 'translate(-50%, -50%)');
    instructionsPopup.style('background-color', 'rgba(0, 0, 0, 0.85)');
    instructionsPopup.style('border-radius', '12px');
    instructionsPopup.style('padding', '20px');
    instructionsPopup.style('color', '#fff');
    instructionsPopup.style('font-family', 'Arial');
    instructionsPopup.style('z-index', '1000');
    instructionsPopup.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.2)');
    instructionsPopup.style('display', 'none');

    let popupContent = `
        <h2 style="font-size: 24px; margin-bottom: 15px; text-align: center;">Hướng dẫn sử dụng</h2>
        <ul style="list-style-type: none; padding: 0;">
            <li style="margin-bottom: 10px;">• Nhấn nút "Play" để bắt đầu quá trình mô phỏng liên kết ion.</li>
            <li style="margin-bottom: 10px;">• Sau khi mô phỏng hoàn tất, bạn có thể sử dụng chuột để xoay và xem mô hình từ các góc khác nhau.</li>
            <li style="margin-bottom: 10px;">• Giữ phím **Ctrl** và kéo chuột trái để di chuyển toàn bộ mô hình trên màn hình.</li>
            <li style="margin-bottom: 10px;">• Sử dụng con lăn chuột để phóng to hoặc thu nhỏ.</li>
            <li style="margin-bottom: 10px;">• Nhấn nút "Reset" để quay lại trạng thái ban đầu.</li>
        </ul>
        <button id="closePopup" style="display: block; width: 100%; padding: 10px; margin-top: 20px; font-size: 16px; border: none; border-radius: 6px; background-color: #36d1dc; color: #fff; cursor: pointer;">Đóng</button>
    `;
    instructionsPopup.html(popupContent);

    document.getElementById('closePopup').addEventListener('click', () => {
        instructionsPopup.style('display', 'none');
    });

    positionButtons();
}

function styleButton(btn, isTransparent = false) {
    btn.style("width", "120px");
    btn.style("height", "30px");
    btn.style("padding", "0px");
    btn.style("font-size", "12px");
    btn.style("border-radius", "6px");
    btn.style("color", "#fff");
    btn.style("cursor", "pointer");
    btn.style("transition", "all 0.2s ease-in-out");
    btn.style("font-family", "Arial");

    if (isTransparent) {
        btn.style("background", "rgba(0,0,0,0)");
        btn.style("border", "1px solid #fff");
        btn.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    } else {
        btn.style("border", "none");
        btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
        btn.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    }
}

function setupButtonEffects(btn, pressAction) {
    btn.mousePressed(() => {
        btn.style("box-shadow", "inset 2px 2px 4px rgba(0,0,0,0.6)");
        btn.style("transform", "scale(0.95)");
        pressAction();
    });
    btn.mouseReleased(() => {
        btn.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
        btn.style("transform", "scale(1)");
    });
    btn.mouseOver(() => {
        btn.style("background", "linear-gradient(145deg, #667eea, #764ba2)");
    });
    btn.mouseOut(() => {
        btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    });
}

function positionButtons() {
    playButton.position(20, 20);
    rotateElectronsButton.position(20, 60);
    sphereLayerButton.position(20, 100);
    labelButton.position(20, 140);
    resetButton.position(20, 180);
    instructionsButton.position(20, 220);
}

function resetCamera() {
    panX = 0;
    panY = 0;

    let cameraZ = (height / 2.0) / tan(PI * 30.0 / 180.0);
    camera(0, 0, cameraZ, 0, 0, 0, 0, 1, 0);
}

function resetSimulation() {
    resetCamera();

    atoms = [];
    state = "idle";
    progress = 0;
    transferProgress = 0;
    finalProgress = 0;
    transferringElectrons = [];
    showSphereLayer = false;
    showLabels = true;
    rotateElectrons = true;
    flickerAlpha = 0;
    cylinderAlpha = 0;
    cylinderCreated = false;

    atoms.push(new Atom(-initialDistance, 0, "Na", 11, [2, 8, 1], color(0, 200, 255)));
    atoms.push(new Atom(0, 0, "O", 8, [2, 6], color(0, 255, 0)));
    atoms.push(new Atom(initialDistance, 0, "Na", 11, [2, 8, 1], color(0, 200, 255)));

    if (sphereLayerButton) {
        sphereLayerButton.html("Bật lớp cầu");
    }
    if (labelButton) {
        labelButton.html("Tắt nhãn");
    }
    if (rotateElectronsButton) {
        rotateElectronsButton.html("Tắt quay electron");
    }
}

function drawBillboardText(textStr, x, y, z, size) {
    push();
    translate(x, y, z);
    textSize(size);
    text(textStr, 0, 0);
    pop();
}

function draw() {
    background(0);

    if (keyIsDown(17) && mouseIsPressed) {
        panX += (mouseX - pmouseX);
        panY += (mouseY - pmouseY);
    } else {
        orbitControl();
    }

    translate(panX, panY);

    // Use only ambient + two moving directional lights (no fixed point lights)
    if (showSphereLayer) {
        ambientLight(120); // increased a bit for brighter sphere-layer rendering
    } else {
        ambientLight(200); // increased overall ambient when not using sphere layer
    }

    // Two moving directional lights (dynamic highlights) — no fixed lights
    let a1 = frameCount * 0.010;
    let l1x = cos(a1) * 400;
    let l1y = sin(a1) * 240;
    directionalLight(190, 190, 190, l1x, l1y, -0.3); // made a bit brighter

    let a2 = frameCount * 0.018 + PI / 3;
    let l2x = cos(a2) * 220;
    let l2y = sin(a2) * 160;
    directionalLight(150, 150, 150, -l2x, -l2y, 0.2); // made a bit brighter

    if (state === "animating") {
        progress += 0.01;
        let t_move = easeInOutQuad(progress);
        let currentDist = lerp(initialDistance, transferTriggerDistance, t_move);

        if (progress > 1) {
            progress = 1;
            state = "transferring";
            transferProgress = 0;

            transferringElectrons = [
                atoms[0].shells[2][0],
                atoms[2].shells[2][0]
            ];

            atoms[0].shells.pop();
            atoms[2].shells.pop();

            startPos1 = createVector(atoms[0].pos.x + atoms[0].shellRadii[2], atoms[0].pos.y);
            endPos1 = createVector(atoms[1].pos.x - outermostShellRadiusO, atoms[1].pos.y);
            controlPoint1_1 = createVector(p5.Vector.lerp(startPos1, endPos1, 0.3).x, startPos1.y - 30 * scaleFactor, 0);
            controlPoint2_1 = createVector(p5.Vector.lerp(startPos1, endPos1, 0.7).x, endPos1.y - 30 * scaleFactor, 0);

            startPos2 = createVector(atoms[2].pos.x - atoms[2].shellRadii[2], atoms[2].pos.y);
            endPos2 = createVector(atoms[1].pos.x + outermostShellRadiusO, atoms[1].pos.y);
            controlPoint1_2 = createVector(p5.Vector.lerp(startPos2, endPos2, 0.3).x, startPos2.y + 30 * scaleFactor, 0);
            controlPoint2_2 = createVector(p5.Vector.lerp(startPos2, endPos2, 0.7).x, endPos2.y + 30 * scaleFactor, 0);
        }

        atoms[0].pos.x = -currentDist;
        atoms[1].pos.x = 0;
        atoms[2].pos.x = currentDist;
    } else if (state === "transferring") {
        transferProgress += 0.02;
        if (transferProgress > 1) {
            transferProgress = 1;

            atoms[1].shells[1].push(transferringElectrons[0]);
            atoms[1].shells[1].push(transferringElectrons[1]);

            prepareRearrangementO(atoms[1].shells[1]);

            state = "final_bonding_and_rearranging";
            finalProgress = 0;
            transferringElectrons = [];
        }

        if (transferringElectrons.length > 0) {
            let t_transfer = easeOutCubic(transferProgress);

            let mid1 = createVector(
                bezierPoint(startPos1.x, controlPoint1_1.x, controlPoint2_1.x, endPos1.x, t_transfer),
                bezierPoint(startPos1.y, controlPoint1_1.y, controlPoint2_1.y, endPos1.y, t_transfer),
                bezierPoint(startPos1.z, controlPoint1_1.z, controlPoint2_1.z, endPos1.z, t_transfer)
            );

            let mid2 = createVector(
                bezierPoint(startPos2.x, controlPoint1_2.y, controlPoint2_2.x, endPos2.x, t_transfer),
                bezierPoint(startPos2.y, controlPoint1_2.y, controlPoint2_2.y, endPos2.y, t_transfer),
                bezierPoint(startPos2.z, controlPoint1_2.z, controlPoint2_2.z, endPos2.z, t_transfer)
            );

            drawingContext.shadowBlur = lerp(0, 10, t_transfer);
            drawingContext.shadowColor = transferringElectrons[0].col;

            push();
            translate(mid1.x, mid1.y, 0);
            fill(transferringElectrons[0].col);
            sphere(6 * scaleFactor);
            fill(255, 255, 0);
            drawBillboardText("-", 0, -15 * scaleFactor, 0, 18 * scaleFactor);
            pop();

            push();
            translate(mid2.x, mid2.y, 0);
            fill(transferringElectrons[1].col);
            sphere(6 * scaleFactor);
            fill(255, 255, 0);
            drawBillboardText("-", 0, -15 * scaleFactor, 0, 18 * scaleFactor);
            pop();

            drawingContext.shadowBlur = 0;
        }
    } else if (state === "final_bonding_and_rearranging") {
        finalProgress += 0.01;
        if (finalProgress > 1) {
            finalProgress = 1;
            state = "done";
        }

        let t_movement = easeInOutQuad(finalProgress);
        let currentDist = lerp(transferTriggerDistance, finalDistance, t_movement);

        atoms[0].pos.x = -currentDist;
        atoms[1].pos.x = 0;
        atoms[2].pos.x = currentDist;

        let shell = atoms[1].shells[1];
        for (let i = 0; i < shell.length; i++) {
            let e = shell[i];
            let t_rearrange = easeOutCubic(finalProgress);
            e.angle = lerp(e.initialAngle, e.targetAngle, t_rearrange);
        }
    }

    if (rotateElectrons) {
        for (let atom of atoms) {
            for (let shell of atom.shells) {
                for (let e of shell) {
                    let dynamicSpeed = 0.036;
                    e.angle += dynamicSpeed;
                }
            }
        }
    }

    // Render atoms (either with sphere layer or as particles)
    if (showSphereLayer) {
        // Sphere mode: use material-based spheres so directional lights show highlights
        for (let atom of atoms) {
            push();
            translate(atom.pos.x, atom.pos.y, 0);
            let currentOutermostRadius = atom.shellRadii[atom.shells.length - 1];
            if (atom.label === "Na" && (state === "done" || state === "final_bonding_and_rearranging")) {
                currentOutermostRadius = naIonRadius;
            } else if (atom.label === "O" && (state === "done" || state === "final_bonding_and_rearranging")) {
                currentOutermostRadius = oIonRadius;
            }
            atom.showSphere(currentOutermostRadius);
            pop();
        }
    } else {
        // Particles/shells mode (original)
        for (let atom of atoms) {
            push();
            translate(atom.pos.x, atom.pos.y, 0);
            atom.show();
            pop();
        }
    }

    // Connecting cylinders when done + sphere layer enabled
    if (state === "done" && showSphereLayer) {
        if (!cylinderCreated) {
            cylinderAlpha = 0;
            cylinderCreated = true;
        }

        cylinderAlpha = min(cylinderAlpha + 0.02, 1);
        
        let maxFlickerAlpha = 140; 
        flickerAlpha = (sin(frameCount * 1.5) * 0.5 + 0.5 + random(-0.2, 0.2)) * maxFlickerAlpha * cylinderAlpha;
        flickerAlpha = constrain(flickerAlpha, 0, 255);

        let naPos = atoms[0].pos;
        let oPos = atoms[1].pos;
        let na2Pos = atoms[2].pos;

        let p1 = p5.Vector.lerp(naPos, oPos, 0.5);
        let dist1 = naPos.dist(oPos);
        let angle1 = atan2(oPos.y - naPos.y, oPos.x - naPos.x);

        push();
        translate(p1.x, p1.y, p1.z);
        rotateZ(angle1 + HALF_PI);
        fill(255, flickerAlpha);
        cylinder(30 * scaleFactor, dist1);
        pop();

        let p2 = p5.Vector.lerp(na2Pos, oPos, 0.5);
        let dist2 = na2Pos.dist(oPos);
        let angle2 = atan2(oPos.y - na2Pos.y, oPos.x - na2Pos.x);

        push();
        translate(p2.x, p2.y, p2.z);
        rotateZ(angle2 + HALF_PI);
        fill(255, flickerAlpha);
        cylinder(30 * scaleFactor, dist2);
        pop();
    } else {
        cylinderCreated = false;
    }

    // Billboard labels for element symbols
    if (showLabels) {
        for (let atom of atoms) {
            push();
            fill(255);
            let lastRadius = atom.shellRadii[atom.shells.length - 1];
            drawBillboardText(atom.label, atom.pos.x, atom.pos.y + lastRadius + 20 * scaleFactor, 0, 25 * scaleFactor);
            pop();
        }
    }

    // NOTE: Removed the small yellow "+{protons}" billboard labels to avoid duplicates.
    // The 3D nucleus charge labels below (+11, +8, +11) are now the only nucleus-number labels.

    // 3D nucleus charge labels (+11 and +8) positioned as learned from File 1.
    // Ensure both Na atoms have "+11" and the O atom has "+8".
    if (showLabels) {
        let offset = ORBIT_RADIUS;

        // Left Na (atoms[0]) - translate slightly toward viewer and toward center (right)
        if (atoms[0]) {
            push();
            translate(atoms[0].pos.x + offset, atoms[0].pos.y, NUCLEUS_RADIUS + LABEL_OFFSET_EXTRA);
            rotateY(LABEL_ROTATION_MAG);
            fill(255);
            textSize(18 * scaleFactor);
            text("+11", 0, 0);
            pop();
        }

        // Middle O (atoms[1]) - translate slightly toward viewer and slightly left for readability
        if (atoms[1]) {
            push();
            translate(atoms[1].pos.x - offset, atoms[1].pos.y, NUCLEUS_RADIUS + LABEL_OFFSET_EXTRA);
            rotateY(-LABEL_ROTATION_MAG);
            fill(255);
            textSize(18 * scaleFactor);
            text("+8", 0, 0);
            pop();
        }

        // Right Na (atoms[2]) - translate slightly toward viewer and toward center (left)
        if (atoms[2]) {
            push();
            translate(atoms[2].pos.x - offset, atoms[2].pos.y, NUCLEUS_RADIUS + LABEL_OFFSET_EXTRA);
            rotateY(-LABEL_ROTATION_MAG);
            fill(255);
            textSize(18 * scaleFactor);
            text("+11", 0, 0);
            pop();
        }
    }

    // Final large charge signs when bonding/rearranged (unchanged)
    if (state === "done" || state === "final_bonding_and_rearranging") {
        let lastRadiusNa = atoms[0].shellRadii[1];
        fill(255, 255, 0);
        drawBillboardText("+", atoms[0].pos.x, atoms[0].pos.y - (lastRadiusNa + 30 * scaleFactor), 0, 25 * scaleFactor);

        let lastRadiusO = atoms[1].shells.length > 1 ? atoms[1].shellRadii[1] : 0;
        fill(255, 255, 0);
        drawBillboardText("2-", atoms[1].pos.x, atoms[1].pos.y - (lastRadiusO + 30 * scaleFactor), 0, 25 * scaleFactor);

        lastRadiusNa = atoms[2].shellRadii[1];
        fill(255, 255, 0);
        drawBillboardText("+", atoms[2].pos.x, atoms[2].pos.y - (lastRadiusNa + 30 * scaleFactor), 0, 25 * scaleFactor);
    }
}

function prepareRearrangementO(shell) {
    let total = shell.length;
    let spacing = TWO_PI / total;
    for (let i = 0; i < total; i++) {
        shell[i].initialAngle = shell[i].angle;
        shell[i].targetAngle = (i * spacing) - PI / 8;
    }
}

function drawSmoothCircle(radius) {
    let numPoints = 200;
    beginShape();
    for (let i = 0; i < numPoints; i++) {
        let angle = map(i, 0, numPoints, 0, TWO_PI);
        let x = radius * cos(angle);
        let y = radius * sin(angle);
        vertex(x, y);
    }
    endShape(CLOSE);
}

class Atom {
    constructor(x, y, label, protons, shellCounts, electronCol) {
        this.pos = createVector(x, y, 0);
        this.label = label;
        this.protons = protons;
        this.shells = [];
        this.shellRadii = [];
        this.electronCol = electronCol;
        for (let i = 0; i < shellCounts.length; i++) {
            let radius = baseRadius + i * radiusIncrement;
            this.shellRadii.push(radius);
            let shellElectrons = [];
            for (let j = 0; j < shellCounts[i]; j++) {
                shellElectrons.push({
                    angle: (TWO_PI / shellCounts[i]) * j,
                    col: electronCol,
                    initialAngle: (TWO_PI / shellCounts[i]) * j,
                    targetAngle: (TWO_PI / shellCounts[i]) * j
                });
            }
            this.shells.push(shellElectrons);
        }
    }

    show() {
        push();
        fill(255, 0, 0);
        sphere(20 * scaleFactor);
        pop();

        for (let i = 0; i < this.shells.length; i++) {
            if (this.shells[i].length > 0) {
                noFill();
                stroke(255);
                strokeWeight(1);
                drawSmoothCircle(this.shellRadii[i]);
                noStroke();
                for (let e of this.shells[i]) {
                    let angle = e.angle;

                    let ex = cos(angle) * this.shellRadii[i];
                    let ey = sin(angle) * this.shellRadii[i];
                    push();
                    translate(ex, ey, 0);
                    fill(e.col);
                    sphere(6 * scaleFactor);
                    pop();

                    fill(255, 255, 0);
                    drawBillboardText("-", ex, ey - 15 * scaleFactor, 0, 18 * scaleFactor);
                }
            }
        }
    }

    // showSphere uses materials so highlights are dynamic but base color preserved
    showSphere(radius) {
        push();
        // draw nucleus
        fill(255, 0, 0);
        sphere(20 * scaleFactor);
        pop();

        // Apply material-based rendering so lights affect sphere while preserving base color
        push();
        noStroke();

        const r = red(this.electronCol);
        const g = green(this.electronCol);
        const b = blue(this.electronCol);

        shininess(85);
        ambientMaterial(r, g, b);
        specularMaterial(min(255, r + 45), min(255, g + 45), min(255, b + 45));

        // Use higher detail for smoother shading
        sphere(radius, 64, 64);
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    perspective(PI / 3, windowWidth / windowHeight, 0.1, 4000);
    positionButtons();
    resetCamera();
}