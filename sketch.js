// Mô phỏng liên kết ion Na2O 3D - Phiên bản đã sửa lỗi và cập nhật
// Tác giả: GPT-5

let fontRegular; // Biến toàn cục để chứa phông chữ đã tải
let playButton, resetButton, instructionsButton, sphereLayerButton, labelButton; // Thêm biến cho nút nhãn
let titleDiv, footerDiv, instructionsPopup;
let atoms = [];
let state = "idle"; // idle, animating, transferring, final_bonding_and_rearranging, done
let progress = 0; // Biến tiến trình chung cho các pha
let transferProgress = 0; // Biến tiến trình cho việc chuyển electron
let finalProgress = 0; // Biến tiến trình cho giai đoạn cuối: liên kết và sắp xếp lại
let transferringElectrons = []; // Mảng chứa hai electron đang được chuyển
let showSphereLayer = false; // Biến mới để điều khiển việc hiển thị lớp cầu
let showLabels = true; // Biến mới để điều khiển việc hiển thị nhãn

// Tham số cho khoảng cách chuyển động
const naOuterRadius = 50 + 2 * 40; // Bán kính lớp vỏ thứ 3 của Na
const oOuterRadius = 50 + 1 * 40; // Bán kính lớp vỏ thứ 2 của O
const initialShellGap = 100; // Khoảng cách ban đầu giữa các lớp vỏ
const transferShellGap = 20; // Khoảng cách giữa các lớp vỏ khi bắt đầu chuyển electron
const finalShellGap = 10; // Khoảng cách cuối cùng giữa các lớp vỏ (đã thay đổi)

// Thay đổi theo yêu cầu của bạn: Tính toán khoảng cách ban đầu giữa các hạt nhân để lớp vỏ ngoài cách nhau 100px
const initialDistance = naOuterRadius + initialShellGap + oOuterRadius;

const transferTriggerDistance = naOuterRadius + transferShellGap + oOuterRadius;
const finalDistance = naOuterRadius + finalShellGap + oOuterRadius;
const outermostShellRadiusO = 50 + 1 * 40; // Bán kính lớp vỏ thứ 2 của O

// Bán kính mới của lớp cầu sau khi hình thành ion
// Na+ chỉ còn 2 lớp, bán kính giảm
const naIonRadius = 50 + 1 * 40; 
// O2- nhận thêm e, bán kính tăng
const oIonRadius = 50 + 2 * 40; 

// Các điểm điều khiển đường cong Bezier cho việc chuyển electron
let startPos1, endPos1, controlPoint1_1, controlPoint2_1;
let startPos2, endPos2, controlPoint1_2, controlPoint2_2;

// Biến cho việc xoay và di chuyển canvas
let panX = 0;
let panY = 0;

function preload() {
  // Tải phông chữ để tránh lỗi trong chế độ WEBGL
  fontRegular = loadFont('https://fonts.gstatic.com/s/opensans/v27/mem8YaGs126MiZpBA-UFVZ0e.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  // Cập nhật giá trị 'far' của perspective để giảm hiệu ứng "dẹt"
  perspective(PI / 3, width / height, 0.1, 4000);
  
  smooth();
  textFont(fontRegular);
  textAlign(CENTER, CENTER);
  noStroke();
  
  // Tạo UI HTML cố định
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
  
  createUI(); // Tạo UI trước để các nút tồn tại
  resetSimulation();
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2*t*t : -1 + (4-2*t)*t;
}

function easeOutCubic(t) {
  let t1 = t - 1;
  return t1 * t1 * t1 + 1;
}

function createUI() {
  playButton = createButton("▶ Play");
  styleButton(playButton);
  playButton.mousePressed(() => {
    playButton.style("box-shadow", "inset 2px 2px 4px rgba(0,0,0,0.6)");
    playButton.style("transform", "scale(0.95)");
    if (state === "idle") {
      state = "animating";
    }
  });
  playButton.mouseReleased(() => {
    playButton.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    playButton.style("transform", "scale(1)");
  });
  playButton.mouseOver(() => {
    playButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });
  playButton.mouseOut(() => {
    playButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });

  // Thêm nút Bật/Tắt lớp cầu
  sphereLayerButton = createButton("Bật lớp cầu");
  styleButton(sphereLayerButton);
  sphereLayerButton.mousePressed(() => {
    showSphereLayer = !showSphereLayer;
    if (showSphereLayer) {
      sphereLayerButton.html("Tắt lớp cầu");
    } else {
      sphereLayerButton.html("Bật lớp cầu");
    }
  });
  sphereLayerButton.mouseReleased(() => {
    sphereLayerButton.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    sphereLayerButton.style("transform", "scale(1)");
  });
  sphereLayerButton.mouseOver(() => {
    sphereLayerButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });
  sphereLayerButton.mouseOut(() => {
    sphereLayerButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });

  // Thêm nút Bật/Tắt nhãn
  labelButton = createButton("Tắt nhãn");
  styleButton(labelButton);
  labelButton.mousePressed(() => {
    showLabels = !showLabels;
    if (showLabels) {
      labelButton.html("Tắt nhãn");
    } else {
      labelButton.html("Bật nhãn");
    }
  });
  labelButton.mouseReleased(() => {
    labelButton.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    labelButton.style("transform", "scale(1)");
  });
  labelButton.mouseOver(() => {
    labelButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });
  labelButton.mouseOut(() => {
    labelButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });
  
  resetButton = createButton("↺ Reset");
  styleButton(resetButton);
  resetButton.mousePressed(() => {
    resetButton.style("box-shadow", "inset 2px 2px 4px rgba(0,0,0,0.6)");
    resetButton.style("transform", "scale(0.95)");
    resetSimulation();
  });
  resetButton.mouseReleased(() => {
    resetButton.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    resetButton.style("transform", "scale(1)");
  });
  resetButton.mouseOver(() => {
    resetButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });
  resetButton.mouseOut(() => {
    resetButton.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
  });

  instructionsButton = createButton("Hướng dẫn");
  styleButton(instructionsButton, true);
  instructionsButton.mousePressed(() => {
      instructionsPopup.style('display', 'block');
  });

  // Tạo popup hướng dẫn
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
  instructionsPopup.style('display', 'none'); // Ẩn mặc định

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
  btn.style("width", "120px"); // Tăng chiều rộng để vừa văn bản dài hơn
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
    // Buttons will now share a common gradient for a unified look
    btn.style("border", "none");
    btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    btn.style("box-shadow", "2px 2px 4px rgba(0,0,0,0.6)");
    // Added hover effects for a better user experience
    btn.mouseOver(() => {
      btn.style("background", "linear-gradient(145deg, #667eea, #764ba2)");
    });
    btn.mouseOut(() => {
      btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
    });
  }
}

function positionButtons() {
  playButton.position(20, 20);
  sphereLayerButton.position(20, 60); // Đặt vị trí cho nút mới
  labelButton.position(20, 100); // Đặt vị trí cho nút nhãn
  resetButton.position(20, 140);
  instructionsButton.position(20, 180);
}

function resetSimulation() {
  atoms = [];
  // Thêm hai nguyên tử Na và một nguyên tử O ở giữa
  atoms.push(new Atom(-initialDistance, 0, "Na", 11, [2, 8, 1], color(0, 200, 255))); // Màu xanh lam sáng cho electron Na
  atoms.push(new Atom(0, 0, "O", 8, [2, 6], color(0, 255, 0))); // Màu xanh lục sáng cho electron O
  atoms.push(new Atom(initialDistance, 0, "Na", 11, [2, 8, 1], color(0, 200, 255)));
  
  state = "idle";
  progress = 0;
  transferProgress = 0;
  finalProgress = 0;
  transferringElectrons = [];
  panX = 0;
  panY = 0;
  showSphereLayer = false;
  showLabels = true;

  // Cập nhật văn bản của nút nếu nó đã được tạo
  if (sphereLayerButton) {
    sphereLayerButton.html("Bật lớp cầu");
  }
  if (labelButton) {
    labelButton.html("Tắt nhãn");
  }
}

// Hàm mới để vẽ văn bản luôn hướng về phía camera
function drawBillboardText(textStr, x, y, z, size) {
  push();
  translate(x, y, z);
  textSize(size);
  text(textStr, 0, 0);
  pop();
}

function draw() {
  background(0);
  
  // Chức năng di chuyển toàn khối khi nhấn Ctrl
  if (keyIsDown(17) && mouseIsPressed) {
    panX += (mouseX - pmouseX);
    panY += (mouseY - pmouseY);
  } else {
    orbitControl();
  }

  translate(panX, panY);
  
  ambientLight(80);
  pointLight(255, 255, 255, 0, 0, 300);
  
  // Logic mô phỏng mới
  if (state === "animating") {
    progress += 0.01;
    let t_move = easeInOutQuad(progress);
    let currentDist = lerp(initialDistance, transferTriggerDistance, t_move);

    if (progress > 1) {
      progress = 1;
      state = "transferring";
      transferProgress = 0;
      
      // Lấy electron ngoài cùng của mỗi nguyên tử Na
      transferringElectrons = [
        atoms[0].shells[2][0],
        atoms[2].shells[2][0]
      ];

      // Xóa các electron khỏi lớp vỏ Na để chúng không còn quay nữa
      atoms[0].shells.pop(); // Xóa lớp vỏ ngoài cùng của Na
      atoms[2].shells.pop(); // Xóa lớp vỏ ngoài cùng của Na

      // Thiết lập đường chuyển cho electron 1 (từ Na1 sang O)
      startPos1 = createVector(atoms[0].pos.x + atoms[0].shellRadii[2], atoms[0].pos.y);
      endPos1 = createVector(atoms[1].pos.x - outermostShellRadiusO, atoms[1].pos.y);
      // Điều chỉnh các điểm điều khiển để đường cong thẳng hơn (ít cong hơn)
      controlPoint1_1 = createVector(p5.Vector.lerp(startPos1, endPos1, 0.3).x, startPos1.y - 30, 0);
      controlPoint2_1 = createVector(p5.Vector.lerp(startPos1, endPos1, 0.7).x, endPos1.y - 30, 0);
      
      // Thiết lập đường chuyển cho electron 2 (từ Na2 sang O)
      startPos2 = createVector(atoms[2].pos.x - atoms[2].shellRadii[2], atoms[2].pos.y);
      endPos2 = createVector(atoms[1].pos.x + outermostShellRadiusO, atoms[1].pos.y);
      // Điều chỉnh các điểm điều khiển để đường cong thẳng hơn (ít cong hơn)
      controlPoint1_2 = createVector(p5.Vector.lerp(startPos2, endPos2, 0.3).x, startPos2.y + 30, 0);
      controlPoint2_2 = createVector(p5.Vector.lerp(startPos2, endPos2, 0.7).x, endPos2.y + 30, 0);
    }
    
    atoms[0].pos.x = -currentDist;
    atoms[1].pos.x = 0;
    atoms[2].pos.x = currentDist;
  }
  else if (state === "transferring") {
    transferProgress += 0.02;
    if (transferProgress > 1) {
      transferProgress = 1;
      
      // Thêm electron từ mảng transferringElectrons vào lớp vỏ O
      atoms[1].shells[1].push(transferringElectrons[0]);
      atoms[1].shells[1].push(transferringElectrons[1]);
      
      // Chuẩn bị cho việc sắp xếp lại ngay lập tức
      prepareRearrangementO(atoms[1].shells[1]);
      
      // Chuyển sang giai đoạn cuối, kết hợp di chuyển và sắp xếp
      state = "final_bonding_and_rearranging";
      finalProgress = 0;
      transferringElectrons = []; // Xóa mảng để không vẽ nữa
    }
    
    // Chỉ vẽ electron đang chuyển nếu mảng không rỗng
    if (transferringElectrons.length > 0) {
      let t_transfer = easeOutCubic(transferProgress);
      
      // Electron 1
      let mid1 = createVector(
          bezierPoint(startPos1.x, controlPoint1_1.x, controlPoint2_1.x, endPos1.x, t_transfer),
          bezierPoint(startPos1.y, controlPoint1_1.y, controlPoint2_1.y, endPos1.y, t_transfer),
          bezierPoint(startPos1.z, controlPoint1_1.z, controlPoint2_1.z, endPos1.z, t_transfer)
      );
      
      // Electron 2
      let mid2 = createVector(
          bezierPoint(startPos2.x, controlPoint1_2.x, controlPoint2_2.x, endPos2.x, t_transfer),
          bezierPoint(startPos2.y, controlPoint1_2.y, controlPoint2_2.y, endPos2.y, t_transfer),
          bezierPoint(startPos2.z, controlPoint1_2.z, controlPoint2_2.z, endPos2.z, t_transfer)
      );
      
      // Hiệu ứng vệt sáng và vẽ cả hai electron
      drawingContext.shadowBlur = lerp(0, 10, t_transfer);
      drawingContext.shadowColor = transferringElectrons[0].col;
      
      push();
      translate(mid1.x, mid1.y, 0);
      fill(transferringElectrons[0].col);
      sphere(6);
      fill(255, 255, 0); // Nhãn màu vàng
      drawBillboardText("-", 0, -15, 0, 18);
      pop();
      
      push();
      translate(mid2.x, mid2.y, 0);
      fill(transferringElectrons[1].col);
      sphere(6);
      fill(255, 255, 0); // Nhãn màu vàng
      drawBillboardText("-", 0, -15, 0, 18);
      pop();
      
      drawingContext.shadowBlur = 0;
    }
  }
  else if (state === "final_bonding_and_rearranging") {
    finalProgress += 0.01;
    if (finalProgress > 1) {
      finalProgress = 1;
      state = "done";
    }
    
    // Di chuyển các nguyên tử và sắp xếp lại electron cùng lúc
    let t_movement = easeInOutQuad(finalProgress);
    let currentDist = lerp(transferTriggerDistance, finalDistance, t_movement);
    
    atoms[0].pos.x = -currentDist;
    atoms[1].pos.x = 0;
    atoms[2].pos.x = currentDist;
    
    // Sắp xếp lại lớp vỏ của O
    let shell = atoms[1].shells[1];
    for (let i = 0; i < shell.length; i++) {
      let e = shell[i];
      let t_rearrange = easeOutCubic(finalProgress);
      e.angle = lerp(e.initialAngle, e.targetAngle, t_rearrange);
    }
  }
  
  // Cập nhật tốc độ quay của tất cả các electron trong mọi trạng thái
  for (let atom of atoms) {
    for (let shell of atom.shells) {
      for (let e of shell) {
        let dynamicSpeed = 0.036; // Tốc độ quay mới
        e.angle += dynamicSpeed;
      }
    }
  }

  // Logic hiển thị mới: Tắt/bật lớp cầu
  if (showSphereLayer) {
    for (let atom of atoms) {
      push();
      translate(atom.pos.x, atom.pos.y, 0);
      // Lấy bán kính lớp vỏ ngoài cùng hiện tại của nguyên tử/ion
      let currentOutermostRadius = atom.shellRadii[atom.shells.length - 1];
      atom.showSphere(currentOutermostRadius);
      pop();
    }
  } else {
    for (let atom of atoms) {
      push();
      translate(atom.pos.x, atom.pos.y, 0);
      atom.show();
      pop();
    }
  }
  
  // Vẽ nhãn nguyên tử/ion
  if (showLabels) {
    for (let atom of atoms) {
      push();
      fill(255); // Màu trắng cho nhãn nguyên tử
      let lastRadius = atom.shellRadii[atom.shells.length - 1];
      drawBillboardText(atom.label, atom.pos.x, atom.pos.y + lastRadius + 20, 0, 25);
      pop();
    }
  }
  
  // Vẽ nhãn điện tích hạt nhân
  for (let atom of atoms) {
    push();
    fill(255, 255, 0); // Nhãn màu vàng
    drawBillboardText(`+${atom.protons}`, atom.pos.x, atom.pos.y - 30, 0, 18);
    pop();
  }
  
  // Vẽ nhãn ion
  if (state === "done" || state === "final_bonding_and_rearranging") {
    // Na1 bên trái
    let lastRadiusNa = atoms[0].shellRadii[1];
    fill(255, 255, 0); // Nhãn màu vàng
    drawBillboardText("+", atoms[0].pos.x, atoms[0].pos.y - (lastRadiusNa + 30), 0, 25);
    
    // O ở giữa
    let lastRadiusO = atoms[1].shellRadii[1];
    fill(255, 255, 0); // Nhãn màu vàng
    drawBillboardText("2-", atoms[1].pos.x, atoms[1].pos.y - (lastRadiusO + 30), 0, 25);

    // Na2 bên phải
    lastRadiusNa = atoms[2].shellRadii[1];
    fill(255, 255, 0); // Nhãn màu vàng
    drawBillboardText("+", atoms[2].pos.x, atoms[2].pos.y - (lastRadiusNa + 30), 0, 25);
  }
}

function prepareRearrangementO(shell) {
  let total = shell.length;
  let spacing = TWO_PI / total;
  for (let i = 0; i < total; i++) {
    shell[i].initialAngle = shell[i].angle;
    shell[i].targetAngle = (i * spacing) - PI/8;
  }
}

function drawSmoothCircle(radius) {
  let numPoints = 200;
  beginShape();
  for (let i = 0; i < numPoints; i++){
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
    this.electronCol = electronCol; // Lưu màu electron
    let baseR = 50;
    let increment = 40;
    for (let i = 0; i < shellCounts.length; i++) {
      let radius = baseR + i * increment;
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
    fill(255, 0, 0); // Hạt nhân màu đỏ
    sphere(20);
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
          sphere(6);
          pop();
          
          fill(255, 255, 0); // Nhãn màu vàng
          drawBillboardText("-", ex, ey-15, 0, 18);
        }
      }
    }
  }

  // Hàm mới để vẽ lớp cầu, nhận bán kính mới
  showSphere(radius) {
    // Vẽ hạt nhân
    push();
    fill(255, 0, 0); // Hạt nhân màu đỏ
    sphere(20);
    pop();
    
    // Vẽ lớp cầu trơn
    noStroke();
    fill(this.electronCol, 100); // Màu electron với độ trong suốt 100
    sphere(radius);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  perspective(PI / 3, windowWidth/windowHeight, 0.1, 4000);
  positionButtons();
}