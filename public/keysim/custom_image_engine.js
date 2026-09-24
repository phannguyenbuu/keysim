/**
 * custom_image_engine.js
 * 
 * 1. Computes 3D Bounding Boxes directly from Three.js scene (syncing with Classic/New Model).
 * 2. Provides an interactive 2D Keycap Art Editor canvas overlay.
 * 3. Projects & slices the artwork onto all 86 3D keycaps in real-time.
 * 4. Generates an A3 print-ready layered PDF with bleed margins and vector guides.
 * 5. Communicates with parent window via postMessage.
 */

(function () {
  'use strict';

  console.log('[CustomImageEngine] Initializing...');

  // State
  let customImage = null; // HTMLImageElement
  let customImageDataUrl = null;
  let imgTransform = {
    x: 0,      // Offset X
    y: 0,      // Offset Y
    scale: 1,  // Uniform scale
    rotDeg: 0, // Rotation in degrees
  };
  let editorOpen = false;
  let activeTool = 'select'; // 'select', 'drag'
  let isDragging = false;
  let dragStart = { x: 0, y: 0, imgX: 0, imgY: 0 };
  let isResizing = false;
  let resizeHandle = null;
  let resizeStart = { x: 0, y: 0, w: 0, h: 0, scale: 1 };
  
  // Styling settings
  let legendColor = '#ffffff';
  let outlineColor = '#ffffff80';
  let hideOutlines = false;

  // Key label mapping helpers
  const CODE_LABELS = {
    'KC_ESC': 'ESC', 'KC_F1': 'F1', 'KC_F2': 'F2', 'KC_F3': 'F3', 'KC_F4': 'F4',
    'KC_F5': 'F5', 'KC_F6': 'F6', 'KC_F7': 'F7', 'KC_F8': 'F8', 'KC_F9': 'F9',
    'KC_F10': 'F10', 'KC_F11': 'F11', 'KC_F12': 'F12', 'KC_PSCR': 'PRTSC', 'KC_SLCK': 'SCRLK', 'KC_PAUS': 'PAUSE',
    'KC_GRV': '~', 'KC_1': '1', 'KC_2': '2', 'KC_3': '3', 'KC_4': '4',
    'KC_5': '5', 'KC_6': '6', 'KC_7': '7', 'KC_8': '8', 'KC_9': '9',
    'KC_0': '0', 'KC_MINS': '-', 'KC_EQL': '=', 'KC_BSPC': 'BACKSPACE',
    'KC_TAB': 'TAB', 'KC_Q': 'Q', 'KC_W': 'W', 'KC_E': 'E', 'KC_R': 'R',
    'KC_T': 'T', 'KC_Y': 'Y', 'KC_U': 'U', 'KC_I': 'I', 'KC_O': 'O',
    'KC_P': 'P', 'KC_LBRC': '[', 'KC_RBRC': ']', 'KC_BSLS': '\\',
    'KC_CAPS': 'CAPS', 'KC_A': 'A', 'KC_S': 'S', 'KC_D': 'D', 'KC_F': 'F',
    'KC_G': 'G', 'KC_H': 'H', 'KC_J': 'J', 'KC_K': 'K', 'KC_L': 'L',
    'KC_SCLN': ';', 'KC_QUOT': "'", 'KC_ENT': 'ENTER',
    'KC_LSFT': 'SHIFT', 'KC_Z': 'Z', 'KC_X': 'X', 'KC_C': 'C', 'KC_V': 'V',
    'KC_B': 'B', 'KC_N': 'N', 'KC_M': 'M', 'KC_COMM': '<', 'KC_DOT': '>',
    'KC_SLSH': '?', 'KC_RSFT': 'SHIFT',
    'KC_LCTL': 'CTRL', 'KC_LGUI': 'WIN', 'KC_LALT': 'ALT', 'KC_SPC': 'SPACE',
    'KC_RALT': 'ALT', 'KC_RGUI': 'WIN', 'KC_APP': 'MENU', 'KC_RCTL': 'CTRL', 'KC_FN': 'FN',
    'KC_INS': 'INS', 'KC_HOME': 'HOME', 'KC_PGUP': 'PGUP',
    'KC_DEL': 'DEL', 'KC_END': 'END', 'KC_PGDN': 'PGDN',
    'KC_UP': '▲', 'KC_LEFT': '◄', 'KC_DOWN': '▼', 'KC_RGHT': '►'
  };

  function getKeyDisplayLabel(code, isNewModel) {
    if (isNewModel) {
      if (code === 'KC_HOME') return 'DEL';
      if (code === 'KC_END') return 'PG UP';
      if (code === 'KC_PGUP') return 'PG DN';
    }
    return CODE_LABELS[code] || code.replace('KC_', '');
  }

  // 1. DYNAMIC 3D BOUNDING BOX CALCULATION
  window.getKeyBBoxes = function () {
    if (!window.KEYS || !window.KEYS.components || !window.THREE) {
      return null;
    }

    const THREE = window.THREE;
    const isNewModel = (() => {
      const pscr = window.KEYS.components.find(c => c.code === 'KC_PSCR');
      if (pscr && pscr.cap) return !pscr.cap.visible;
      const newObj = window.CASE && window.CASE.group ? window.CASE.group.getObjectByName('NEW_KEYBASE_MODEL') : null;
      if (newObj && newObj.visible) return true;
      return true;
    })();
    const keys = [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    window.KEYS.components.forEach((comp, idx) => {
      if (!comp.cap) return;
      // In New Model mode, skip hidden keys (PrtSc, ScrollLock, Insert)
      if (comp.code === 'KC_PSCR' || comp.code === 'KC_SLCK' || comp.code === 'KC_INS') {
        return;
      }

      const box = new THREE.Box3().setFromObject(comp.cap);
      const size = new THREE.Vector3();
      box.getSize(size);

      if (box.min.x < minX) minX = box.min.x;
      if (box.max.x > maxX) maxX = box.max.x;
      if (box.min.z < minZ) minZ = box.min.z;
      if (box.max.z > maxZ) maxZ = box.max.z;

      keys.push({
        idx,
        code: comp.code,
        legend: comp.legend,
        comp,
        label: getKeyDisplayLabel(comp.code, isNewModel),
        box: {
          minX: box.min.x, maxX: box.max.x,
          minZ: box.min.z, maxZ: box.max.z,
          sizeX: size.x, sizeZ: size.z,
          centerX: (box.min.x + box.max.x) / 2,
          centerZ: (box.min.z + box.max.z) / 2,
        }
      });
    });

    const totalWidth = maxX - minX || 1;
    const totalHeight = maxZ - minZ || 1;

    // Compute normalized coordinates [0, 1]
    keys.forEach(k => {
      k.norm = {
        x: (k.box.minX - minX) / totalWidth,
        y: (k.box.minZ - minZ) / totalHeight,
        w: k.box.sizeX / totalWidth,
        h: k.box.sizeZ / totalHeight,
        cx: (k.box.centerX - minX) / totalWidth,
        cy: (k.box.centerZ - minZ) / totalHeight,
      };
    });

    return {
      keys,
      bounds: { minX, maxX, minZ, maxZ, totalWidth, totalHeight },
      isNewModel,
      aspectRatio: totalWidth / totalHeight
    };
  };

  // 2. SLICE IMAGE AND APPLY DIRECTLY TO 3D KEYCAPS
  window.sliceAndApplyTo3D = function (img, transform) {
    const layout = window.getKeyBBoxes();
    if (!layout || !layout.keys.length || !img) {
      console.warn('[CustomImageEngine] Cannot apply: layout or image missing');
      return false;
    }

    const THREE = window.THREE;
    const { keys } = layout;

    // Create a virtual canvas covering the entire keyboard layout
    // We map img onto this keyboard surface
    const KB_CANVAS_W = 2048;
    const KB_CANVAS_H = Math.round(KB_CANVAS_W / layout.aspectRatio);

    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = KB_CANVAS_W;
    masterCanvas.height = KB_CANVAS_H;
    const mctx = masterCanvas.getContext('2d');

    // Fill background
    mctx.fillStyle = '#111118';
    mctx.fillRect(0, 0, KB_CANVAS_W, KB_CANVAS_H);

    // Draw transformed image
    mctx.save();
    // Center of canvas
    const cx = KB_CANVAS_W / 2 + (transform.x || 0);
    const cy = KB_CANVAS_H / 2 + (transform.y || 0);
    mctx.translate(cx, cy);
    mctx.rotate(((transform.rotDeg || 0) * Math.PI) / 180);

    const baseScale = Math.max(KB_CANVAS_W / img.width, KB_CANVAS_H / img.height);
    const drawW = img.width * baseScale * (transform.scale || 1);
    const drawH = img.height * baseScale * (transform.scale || 1);

    mctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    mctx.restore();

    // Slicing each key
    let appliedCount = 0;
    keys.forEach(k => {
      const comp = k.comp;
      if (!comp || !comp.cap || !comp.cap.material) return;

      const kx = Math.round(k.norm.x * KB_CANVAS_W);
      const ky = Math.round(k.norm.y * KB_CANVAS_H);
      const kw = Math.max(16, Math.round(k.norm.w * KB_CANVAS_W));
      const kh = Math.max(16, Math.round(k.norm.h * KB_CANVAS_H));

      // Keycap texture canvas proportional to key physical width/height
      const wUnits = (comp.options && comp.options.w) ? comp.options.w : 1;
      const hUnits = (comp.options && comp.options.h) ? comp.options.h : 1;
      const res = 256;
      const keyCanvas = document.createElement('canvas');
      keyCanvas.width = Math.round(res * wUnits);
      keyCanvas.height = Math.round(res * hUnits);
      const kctx = keyCanvas.getContext('2d');

      // Draw cropped slice
      kctx.drawImage(masterCanvas, kx, ky, kw, kh, 0, 0, keyCanvas.width, keyCanvas.height);

      // Draw legend on top of the slice
      const label = k.label || '';
      if (label) {
        kctx.save();
        kctx.fillStyle = legendColor || '#ffffff';
        kctx.shadowColor = 'rgba(0,0,0,0.85)';
        kctx.shadowBlur = 5;
        kctx.shadowOffsetX = 1;
        kctx.shadowOffsetY = 1;

        let fontSize = 34;
        if (label.length > 3) fontSize = 22;
        if (label.length > 6) fontSize = 16;
        kctx.font = `bold ${fontSize}px "Inter", "Segoe UI", sans-serif`;
        kctx.textAlign = 'left';
        kctx.textBaseline = 'top';
        kctx.fillText(label, 20, 20);
        kctx.restore();
      }

      // Create Three.js texture
      const tex = new THREE.CanvasTexture(keyCanvas);
      tex.needsUpdate = true;

      // Slot 3 is the normal top legend face in KeySim
      // Slot 1 is the pressed top legend face in KeySim
      if (comp.cap.material[3]) {
        comp.cap.material[3].map = tex;
        comp.cap.material[3].color.set('#ffffff');
        comp.cap.material[3].needsUpdate = true;
      }
      if (comp.cap.material[1]) {
        comp.cap.material[1].map = tex;
        comp.cap.material[1].color.set('#ffffff');
        comp.cap.material[1].needsUpdate = true;
      }
      // Ensure body materials slot 2 & 0 are clean white
      if (comp.cap.material[2]) {
        comp.cap.material[2].color.set('#ffffff');
        comp.cap.material[2].needsUpdate = true;
      }
      if (comp.cap.material[0]) {
        comp.cap.material[0].color.set('#ffffff');
        comp.cap.material[0].needsUpdate = true;
      }

      appliedCount++;
    });

    console.log(`[CustomImageEngine] Applied custom texture to ${appliedCount} keys in 3D scene!`);
    showToast(`Applied artwork to ${appliedCount} 3D keys successfully!`);
    return true;
  };

  // 3. EXPORT PRINT-READY A3 PDF
  window.exportPrintPdf = function () {
    if (!customImage) {
      alert('Please choose or upload an image before exporting PDF!');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('jsPDF library is loading. Please wait a moment...');
      return;
    }

    showToast('Generating print-ready A3 PDF...');

    const layout = window.getKeyBBoxes();
    if (!layout || !layout.keys.length) return;

    // Master layout image render
    const KB_CANVAS_W = 2400;
    const KB_CANVAS_H = Math.round(KB_CANVAS_W / layout.aspectRatio);
    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = KB_CANVAS_W;
    masterCanvas.height = KB_CANVAS_H;
    const mctx = masterCanvas.getContext('2d');
    mctx.fillStyle = '#ffffff';
    mctx.fillRect(0, 0, KB_CANVAS_W, KB_CANVAS_H);

    mctx.save();
    const cx = KB_CANVAS_W / 2 + (imgTransform.x || 0);
    const cy = KB_CANVAS_H / 2 + (imgTransform.y || 0);
    mctx.translate(cx, cy);
    mctx.rotate(((imgTransform.rotDeg || 0) * Math.PI) / 180);
    const baseScale = Math.max(KB_CANVAS_W / customImage.width, KB_CANVAS_H / customImage.height);
    const drawW = customImage.width * baseScale * (imgTransform.scale || 1);
    const drawH = customImage.height * baseScale * (imgTransform.scale || 1);
    mctx.drawImage(customImage, -drawW / 2, -drawH / 2, drawW, drawH);
    mctx.restore();

    // Setup A3 Document (420 x 297 mm landscape)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a3'
    });

    const PAGE_W = 420;
    const PAGE_H = 297;

    // Filter standard keys vs special keys
    // Standard 1U keys have width close to minimum width
    const minW = Math.min(...layout.keys.map(k => k.norm.w));
    const standardKeys = [];
    const specialKeys = [];

    layout.keys.forEach(k => {
      // 1U keys are within 15% of minW
      if (k.norm.w <= minW * 1.18) {
        standardKeys.push(k);
      } else {
        specialKeys.push(k);
      }
    });

    // --- PAGE 1: Standard Keycaps Grid (9 cols x 7 rows = 63 keys max) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`KeySim 3D - Sheet 1: Standard Keycaps (${layout.isNewModel ? 'New Model' : 'Classic Model'})`, 15, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Size: A3 Landscape | UV / Dye-Sublimation Print Ready (Bleed Margin: 50%)`, 15, 21);

    const cols1 = 9;
    const rows1 = 7;
    const cellW = 28; // mm
    const cellH = 28; // mm
    const gap = 3;   // mm
    const gridW = cols1 * cellW + (cols1 - 1) * gap;
    const gridH = rows1 * cellH + (rows1 - 1) * gap;
    const startX = (PAGE_W - gridW) / 2;
    const startY = 30;

    standardKeys.slice(0, cols1 * rows1).forEach((k, idx) => {
      const c = idx % cols1;
      const r = Math.floor(idx / cols1);
      const x = startX + c * (cellW + gap);
      const y = startY + r * (cellH + gap);

      // Slice image from master canvas
      const kx = Math.round(k.norm.x * KB_CANVAS_W);
      const ky = Math.round(k.norm.y * KB_CANVAS_H);
      const kw = Math.max(16, Math.round(k.norm.w * KB_CANVAS_W));
      const kh = Math.max(16, Math.round(k.norm.h * KB_CANVAS_H));

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = 180;
      sliceCanvas.height = 180;
      const sctx = sliceCanvas.getContext('2d');
      sctx.drawImage(masterCanvas, kx, ky, kw, kh, 0, 0, 180, 180);

      // Add image to PDF
      const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(sliceDataUrl, 'JPEG', x, y, cellW, cellH);

      // Draw cut line / border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(x, y, cellW, cellH, 'S');

      // Key legend label
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8);
      doc.text(k.label || k.code, x + 2, y + 4);
    });

    // --- PAGE 2: Special, Modifiers, and Long Keys ---
    doc.addPage('a3', 'landscape');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`KeySim 3D - Sheet 2: Special & Long Keycaps (${layout.isNewModel ? 'New Model' : 'Classic Model'})`, 15, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Size: A3 Landscape | Spacebar, Shift, Enter, Backspace, Modifiers`, 15, 21);

    // Remaining standard keys (if any) + all special keys
    const remainingKeys = standardKeys.slice(cols1 * rows1).concat(specialKeys);
    let curX = 25;
    let curY = 35;
    let maxRowH = 0;

    remainingKeys.forEach((k) => {
      // Physical scale in mm relative to 1U (cellW = 28)
      const uWidth = Math.max(cellW, Math.round((k.norm.w / minW) * cellW));
      const uHeight = cellH;

      if (curX + uWidth > PAGE_W - 25) {
        curX = 25;
        curY += maxRowH + 6;
        maxRowH = 0;
      }

      const kx = Math.round(k.norm.x * KB_CANVAS_W);
      const ky = Math.round(k.norm.y * KB_CANVAS_H);
      const kw = Math.max(16, Math.round(k.norm.w * KB_CANVAS_W));
      const kh = Math.max(16, Math.round(k.norm.h * KB_CANVAS_H));

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = Math.round(uWidth * 6);
      sliceCanvas.height = Math.round(uHeight * 6);
      const sctx = sliceCanvas.getContext('2d');
      sctx.drawImage(masterCanvas, kx, ky, kw, kh, 0, 0, sliceCanvas.width, sliceCanvas.height);

      const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(sliceDataUrl, 'JPEG', curX, curY, uWidth, uHeight);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(curX, curY, uWidth, uHeight, 'S');

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8);
      doc.text(k.label || k.code, curX + 2, curY + 4);

      curX += uWidth + 4;
      if (uHeight > maxRowH) maxRowH = uHeight;
    });

    const filename = `keysim_print_A3_${layout.isNewModel ? 'new_model' : 'classic'}.pdf`;
    doc.save(filename);
    showToast(`Downloaded print PDF: ${filename}`);
  };

  // 4. UI CREATION: 2D IMAGE EDITOR MODAL / DRAWER
  function createEditorUI() {
    if (document.getElementById('keycap-art-editor-root')) return;

    const root = document.createElement('div');
    root.id = 'keycap-art-editor-root';
    root.innerHTML = `
      <style>
        #keycap-art-editor-root {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(8, 8, 14, 0.94);
          backdrop-filter: blur(10px);
          z-index: 99999;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #fff;
          flex-direction: column;
        }
        #keycap-art-editor-root.active {
          display: flex;
        }
        .art-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: #12121e;
          border-bottom: 1px solid #232338;
        }
        .art-title {
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .art-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          background: #2563eb;
          color: #fff;
          letter-spacing: 0.5px;
        }
        .art-badge.new-model {
          background: #059669;
        }
        .art-tools {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .art-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #2e2e4a;
          background: #1a1a2e;
          color: #e2e8f0;
          transition: all 0.15s ease;
        }
        .art-btn:hover {
          background: #272744;
          border-color: #4a4a75;
          color: #fff;
        }
        .art-btn-primary {
          background: #a3e635;
          color: #000;
          border-color: #84cc16;
          font-weight: 700;
        }
        .art-btn-primary:hover {
          background: #bef264;
          border-color: #a3e635;
          color: #000;
        }
        .art-btn-secondary {
          background: #3b82f6;
          color: #fff;
          border-color: #2563eb;
        }
        .art-btn-secondary:hover {
          background: #60a5fa;
        }
        .art-body {
          flex: 1;
          display: flex;
          position: relative;
          overflow: hidden;
        }
        .art-canvas-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: #0b0b12;
          overflow: hidden;
          cursor: grab;
        }
        .art-canvas-container:active {
          cursor: grabbing;
        }
        #keycap-art-canvas {
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          border-radius: 8px;
          border: 1px solid #232338;
        }
        .art-sidebar {
          width: 320px;
          background: #12121e;
          border-left: 1px solid #232338;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }
        .art-group {
          background: #171727;
          border: 1px solid #232338;
          border-radius: 10px;
          padding: 14px;
        }
        .art-group-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #94a3b8;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .art-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 13px;
        }
        .art-row:last-child {
          margin-bottom: 0;
        }
        .art-slider {
          flex: 1;
          margin-left: 12px;
          accent-color: #a3e635;
        }
        .art-color-picker {
          width: 36px;
          height: 28px;
          padding: 0;
          border: 1px solid #3b3b55;
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
        }
        .art-toast {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid #38bdf8;
          padding: 10px 20px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s ease;
          z-index: 100000;
        }
        .art-toast.show {
          opacity: 1;
          bottom: 40px;
        }
      </style>

      <div class="art-header">
        <div class="art-title">
          <span>2D Keycap Art Editor</span>
          <span id="art-model-badge" class="art-badge">Classic Model</span>
        </div>
        <div class="art-tools">
          <input type="file" id="art-file-input" accept="image/*" style="display:none;" />
          <button class="art-btn" id="art-btn-browse">Change Image</button>
          <button class="art-btn" id="art-btn-fit">Fit Keyboard</button>
          <button class="art-btn" id="art-btn-center">Center</button>
          <button class="art-btn" id="art-btn-rotate">Rotate 90°</button>
          <button class="art-btn" id="art-btn-reset">Reset</button>
          <button class="art-btn" id="art-btn-close">Close</button>
        </div>
      </div>

      <div class="art-body">
        <div class="art-canvas-container" id="art-canvas-container">
          <canvas id="keycap-art-canvas" width="1000" height="340"></canvas>
        </div>

        <div class="art-sidebar">
          <div class="art-group">
            <div class="art-group-title">Image Adjustments</div>
            <div class="art-row">
              <span>Scale / Zoom:</span>
              <input type="range" id="art-scale-slider" class="art-slider" min="0.2" max="3.0" step="0.05" value="1.0" />
            </div>
            <div class="art-row">
              <span>Rotation:</span>
              <input type="range" id="art-rot-slider" class="art-slider" min="-180" max="180" step="1" value="0" />
            </div>
          </div>

          <div class="art-group">
            <div class="art-group-title">Keycap Styling</div>
            <div class="art-row">
              <span>Legend Color:</span>
              <input type="color" id="art-legend-color" class="art-color-picker" value="#ffffff" />
            </div>
            <div class="art-row">
              <span>Cut Border:</span>
              <input type="color" id="art-border-color" class="art-color-picker" value="#ffffff" />
            </div>
          </div>

          <div style="flex:1;"></div>

          <button class="art-btn art-btn-primary" id="art-btn-apply-3d" style="width:100%; justify-content:center; padding:12px; font-size:14px;">
            Apply to 3D View
          </button>
          <button class="art-btn art-btn-secondary" id="art-btn-export-pdf" style="width:100%; justify-content:center; padding:10px; font-size:13px;">
            Export Print PDF (A3)
          </button>
        </div>
      </div>

      <div id="art-toast" class="art-toast">Notification</div>
    `;

    document.body.appendChild(root);
    setupEditorEvents();
  }

  function showToast(msg) {
    let toast = document.getElementById('art-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'art-toast';
      toast.className = 'art-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // 5. RENDER 2D CANVAS WITH IMAGE & LIVE 3D BBOXES
  function render2DCanvas() {
    const canvas = document.getElementById('keycap-art-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const layout = window.getKeyBBoxes();
    if (!layout) return;

    // Update model badge
    const badge = document.getElementById('art-model-badge');
    if (badge) {
      badge.textContent = layout.isNewModel ? 'New Model Mode' : 'Classic Model Mode';
      badge.className = `art-badge ${layout.isNewModel ? 'new-model' : ''}`;
    }

    // Set canvas dimensions matching keyboard aspect ratio
    const W = 1000;
    const H = Math.round(W / layout.aspectRatio);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    // Clear
    ctx.fillStyle = '#0f0f18';
    ctx.fillRect(0, 0, W, H);

    // Draw uploaded image
    if (customImage) {
      ctx.save();
      const cx = W / 2 + imgTransform.x;
      const cy = H / 2 + imgTransform.y;
      ctx.translate(cx, cy);
      ctx.rotate((imgTransform.rotDeg * Math.PI) / 180);

      const baseScale = Math.max(W / customImage.width, H / customImage.height);
      const drawW = customImage.width * baseScale * imgTransform.scale;
      const drawH = customImage.height * baseScale * imgTransform.scale;

      ctx.drawImage(customImage, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      // Placeholder background
      ctx.fillStyle = '#1e1e30';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No image selected. Please click "Change Image" to upload.', W / 2, H / 2);
    }

    // Draw Keycap Bounding Boxes (computed directly from 3D Three.js scene)
    const rad = 4;
    layout.keys.forEach(k => {
      const kx = k.norm.x * W;
      const ky = k.norm.y * H;
      const kw = k.norm.w * W;
      const kh = k.norm.h * H;

      // Rounded rect keycap stroke
      ctx.strokeStyle = outlineColor || '#ffffff80';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(kx + 1, ky + 1, kw - 2, kh - 2, rad);
      ctx.stroke();

      // Semi-transparent overlay to demarcate keys
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fill();

      // Legend
      ctx.fillStyle = legendColor || '#ffffff';
      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;

      const label = k.label || '';
      if (label.length <= 4) {
        ctx.fillText(label, kx + 4, ky + 4);
      } else {
        ctx.font = '9px "Inter", sans-serif';
        ctx.fillText(label, kx + 3, ky + 4);
      }
    });
  }

  // 6. SETUP INTERACTIVE CONTROLS
  function setupEditorEvents() {
    const root = document.getElementById('keycap-art-editor-root');
    const container = document.getElementById('art-canvas-container');
    const fileInput = document.getElementById('art-file-input');
    const btnBrowse = document.getElementById('art-btn-browse');
    const btnFit = document.getElementById('art-btn-fit');
    const btnCenter = document.getElementById('art-btn-center');
    const btnRotate = document.getElementById('art-btn-rotate');
    const btnReset = document.getElementById('art-btn-reset');
    const btnClose = document.getElementById('art-btn-close');
    const scaleSlider = document.getElementById('art-scale-slider');
    const rotSlider = document.getElementById('art-rot-slider');
    const legendPicker = document.getElementById('art-legend-color');
    const borderPicker = document.getElementById('art-border-color');
    const btnApply = document.getElementById('art-btn-apply-3d');
    const btnExport = document.getElementById('art-btn-export-pdf');

    if (btnBrowse) btnBrowse.onclick = () => fileInput && fileInput.click();
    if (fileInput) fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        window.loadCustomImageFromUrl(ev.target?.result);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    if (btnFit) btnFit.onclick = () => {
      imgTransform.x = 0;
      imgTransform.y = 0;
      imgTransform.scale = 1.0;
      if (scaleSlider) scaleSlider.value = 1.0;
      render2DCanvas();
    };

    if (btnCenter) btnCenter.onclick = () => {
      imgTransform.x = 0;
      imgTransform.y = 0;
      render2DCanvas();
    };

    if (btnRotate) btnRotate.onclick = () => {
      imgTransform.rotDeg = (imgTransform.rotDeg + 90) % 360;
      if (rotSlider) rotSlider.value = imgTransform.rotDeg;
      render2DCanvas();
    };

    if (btnReset) btnReset.onclick = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
      imgTransform = { x: 0, y: 0, scale: 1.0, rotDeg: 0 };
      if (scaleSlider) scaleSlider.value = 1.0;
      if (rotSlider) rotSlider.value = 0;
      render2DCanvas();
    };

    if (btnClose) btnClose.onclick = () => {
      root.classList.remove('active');
      editorOpen = false;
    };

    if (scaleSlider) scaleSlider.oninput = (e) => {
      imgTransform.scale = parseFloat(e.target.value);
      render2DCanvas();
    };

    if (rotSlider) rotSlider.oninput = (e) => {
      imgTransform.rotDeg = parseInt(e.target.value, 10);
      render2DCanvas();
    };

    if (legendPicker) legendPicker.oninput = (e) => {
      legendColor = e.target.value;
      render2DCanvas();
    };

    if (borderPicker) borderPicker.oninput = (e) => {
      outlineColor = e.target.value;
      render2DCanvas();
    };

    // Drag to move image on canvas
    if (container) {
      container.onmousedown = (e) => {
        isDragging = true;
        dragStart = {
          x: e.clientX,
          y: e.clientY,
          imgX: imgTransform.x,
          imgY: imgTransform.y
        };
      };
    }

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      imgTransform.x = dragStart.imgX + dx;
      imgTransform.y = dragStart.imgY + dy;
      render2DCanvas();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Apply to 3D View
    if (btnApply) btnApply.onclick = () => {
      if (!customImage) {
        alert('Please select an image before applying to 3D!');
        return;
      }
      window.sliceAndApplyTo3D(customImage, imgTransform);
      root.classList.remove('active');
      editorOpen = false;
    };

    // Export PDF
    if (btnExport) btnExport.onclick = () => {
      window.exportPrintPdf();
    };
  }

  // 7. PUBLIC API & ACTIONS
  window.openKeycapArtEditor = function () {
    createEditorUI();
    const root = document.getElementById('keycap-art-editor-root');
    if (root) {
      root.classList.add('active');
      editorOpen = true;
      render2DCanvas();
    }
  };

  window.clearCustomArtwork = function () {
    customImage = null;
    customImageDataUrl = null;
    const layout = (typeof window.getKeyBBoxes === 'function') ? window.getKeyBBoxes() : null;
    if (layout && layout.keys) {
      layout.keys.forEach(k => {
        if (k.comp && typeof k.comp.updateColors === 'function') {
          k.comp.updateColors();
        }
      });
    }
    if (typeof updateArtPanelState === 'function') updateArtPanelState();
    if (typeof render2DCanvas === 'function') render2DCanvas();
    const toast = document.getElementById('art-panel-toast');
    if (toast) {
      toast.innerText = 'Cleared artwork';
      setTimeout(() => { if (toast.innerText === 'Cleared artwork') toast.innerText = ''; }, 2500);
    }
  };

  window.loadCustomImageFromUrl = function (dataUrl, autoOpenModal = false) {
    customImageDataUrl = dataUrl;
    const img = new Image();
    img.onload = () => {
      customImage = img;
      if (typeof updateArtPanelState === 'function') updateArtPanelState();
      // Apply immediately to 3D scene
      if (typeof window.sliceAndApplyTo3D === 'function') {
        window.sliceAndApplyTo3D(customImage, imgTransform);
      }
      if (typeof render2DCanvas === 'function') render2DCanvas();
      if (autoOpenModal && typeof window.openKeycapArtEditor === 'function') {
        window.openKeycapArtEditor();
      }
      const toast = document.getElementById('art-panel-toast');
      if (toast) {
        toast.innerText = 'Image loaded & applied!';
        setTimeout(() => { if (toast.innerText.includes('applied')) toast.innerText = ''; }, 3000);
      }
      if (typeof showToast === 'function') showToast('Custom artwork applied to 3D keyboard!');
    };
    img.src = dataUrl;
  };

  // 8. ADD "Custom 2D Art / Load Image" PANEL TO KEYSIM TAB EDITOR (2nd from top)
  let isArtPanelCollapsed = true;

  function updateArtPanelState() {
    const panel = document.getElementById('keysim-art-editor-panel');
    if (!panel) return;

    const pill = panel.querySelector('#art-panel-status-pill');
    const uploadZone = panel.querySelector('#art-panel-upload-zone');
    const btnApply = panel.querySelector('#art-panel-btn-apply');
    const btnExport = panel.querySelector('#art-panel-btn-export');

    if (customImage && customImageDataUrl) {
      if (pill) {
        pill.innerText = `${customImage.width}×${customImage.height}`;
        pill.style.background = 'rgba(16, 185, 129, 0.2)';
        pill.style.color = '#10b981';
        pill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      }
      if (uploadZone) {
        uploadZone.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;">
            <img src="${customImageDataUrl}" alt="Artwork preview" style="width: 64px; height: 42px; object-fit: contain; border-radius: 6px; background: #080810; border: 1px solid #334155; flex-shrink: 0;" />
            <div style="flex: 1; min-width: 0; text-align: left;">
              <div style="font-size: 12px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Artwork Active</div>
              <div style="font-size: 11px; font-family: monospace; color: #10b981; margin-top: 2px;">${customImage.width} × ${customImage.height} px</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;">
              <button type="button" id="art-panel-btn-change" style="padding: 3px 8px; font-size: 11px; font-weight: 600; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 4px; cursor: pointer; transition: all 0.15s;">Change</button>
              <button type="button" id="art-panel-btn-clear" style="padding: 3px 8px; font-size: 11px; font-weight: 600; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; cursor: pointer; transition: all 0.15s;">Clear</button>
            </div>
          </div>
        `;
        const btnChange = uploadZone.querySelector('#art-panel-btn-change');
        if (btnChange) {
          btnChange.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('art-panel-file-input')?.click();
          };
        }
        const btnClear = uploadZone.querySelector('#art-panel-btn-clear');
        if (btnClear) {
          btnClear.onclick = (e) => {
            e.stopPropagation();
            window.clearCustomArtwork();
          };
        }
      }
    } else {
      if (pill) {
        pill.innerText = 'No Image';
        pill.style.background = 'rgba(255, 255, 255, 0.08)';
        pill.style.color = '#94a3b8';
        pill.style.borderColor = 'transparent';
      }
      if (uploadZone) {
        uploadZone.innerHTML = `
          <svg style="width: 24px; height: 24px; color: #818cf8; margin-bottom: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <div style="font-size: 12px; font-weight: 700; color: #f1f5f9;">Choose Artwork or Drop Here</div>
          <div style="font-size: 10px; color: #64748b;">PNG, JPG, WebP, SVG • Slices across keyboard</div>
        `;
      }
    }
  }

  function bindArtPanelEvents(section) {
    const header = section.querySelector('#art-panel-header');
    const body = section.querySelector('#art-panel-body');
    const collapseIcon = section.querySelector('#art-panel-collapse-icon');
    const fileInput = section.querySelector('#art-panel-file-input');
    const uploadZone = section.querySelector('#art-panel-upload-zone');
    const btnOpenEditor = section.querySelector('#art-panel-btn-open-editor');
    const btnApply = section.querySelector('#art-panel-btn-apply');
    const btnExport = section.querySelector('#art-panel-btn-export');
    const btnFit = section.querySelector('#art-panel-btn-fit');
    const btnCenter = section.querySelector('#art-panel-btn-center');
    const btnRot = section.querySelector('#art-panel-btn-rot');
    const legendColorPicker = section.querySelector('#art-panel-legend-color');
    const borderColorPicker = section.querySelector('#art-panel-border-color');
    const toast = section.querySelector('#art-panel-toast');

    // 1. Collapse / Expand toggle
    if (header && body) {
      header.onclick = (e) => {
        isArtPanelCollapsed = !isArtPanelCollapsed;
        if (isArtPanelCollapsed) {
          body.style.display = 'none';
          collapseIcon.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor" class="plus w-6 h-6" style="width: 20px; height: 20px;">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
            </svg>
          `;
        } else {
          body.style.display = 'flex';
          collapseIcon.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor" class="minus w-6 h-6" style="width: 20px; height: 20px;">
              <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"></path>
            </svg>
          `;
        }
      };
    }

    // 2. File input change
    if (fileInput) {
      fileInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            window.loadCustomImageFromUrl(ev.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
    }

    // 3. Dropzone interactions
    if (uploadZone) {
      uploadZone.onclick = () => {
        fileInput?.click();
      };
      uploadZone.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.style.borderColor = '#6366f1';
        uploadZone.style.background = 'rgba(30, 27, 75, 0.8)';
      };
      uploadZone.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.22)';
        uploadZone.style.background = 'rgba(18, 18, 30, 0.65)';
      };
      uploadZone.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.22)';
        uploadZone.style.background = 'rgba(18, 18, 30, 0.65)';
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            window.loadCustomImageFromUrl(ev.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
    }

    // 4. Action buttons
    if (btnOpenEditor) {
      btnOpenEditor.onclick = () => {
        if (!customImage) {
          fileInput?.click();
        } else {
          window.openKeycapArtEditor();
        }
      };
    }

    if (btnApply) {
      btnApply.onclick = () => {
        if (customImage) {
          window.sliceAndApplyTo3D(customImage, imgTransform);
          if (toast) {
            toast.innerText = 'Applied to 3D view!';
            setTimeout(() => { if (toast.innerText === 'Applied to 3D view!') toast.innerText = ''; }, 2500);
          }
        } else {
          fileInput?.click();
        }
      };
    }

    if (btnExport) {
      btnExport.onclick = () => {
        window.exportPrintPdf();
      };
    }

    if (btnFit) {
      btnFit.onclick = () => {
        imgTransform.x = 0;
        imgTransform.y = 0;
        imgTransform.scale = 1.0;
        if (customImage) {
          window.sliceAndApplyTo3D(customImage, imgTransform);
          if (typeof render2DCanvas === 'function') render2DCanvas();
        }
        if (toast) {
          toast.innerText = 'Fit keyboard!';
          setTimeout(() => { if (toast.innerText === 'Fit keyboard!') toast.innerText = ''; }, 2000);
        }
      };
    }

    if (btnCenter) {
      btnCenter.onclick = () => {
        imgTransform.x = 0;
        imgTransform.y = 0;
        if (customImage) {
          window.sliceAndApplyTo3D(customImage, imgTransform);
          if (typeof render2DCanvas === 'function') render2DCanvas();
        }
        if (toast) {
          toast.innerText = 'Centered!';
          setTimeout(() => { if (toast.innerText === 'Centered!') toast.innerText = ''; }, 2000);
        }
      };
    }

    if (btnRot) {
      btnRot.onclick = () => {
        imgTransform.rotDeg = ((imgTransform.rotDeg || 0) + 90) % 360;
        if (customImage) {
          window.sliceAndApplyTo3D(customImage, imgTransform);
          if (typeof render2DCanvas === 'function') render2DCanvas();
        }
        if (toast) {
          toast.innerText = `Rotated: ${imgTransform.rotDeg}°`;
          setTimeout(() => { if (toast.innerText.startsWith('Rotated:')) toast.innerText = ''; }, 2000);
        }
      };
    }

    if (legendColorPicker) {
      legendColorPicker.oninput = (e) => {
        legendColor = e.target.value;
        if (customImage) {
          window.sliceAndApplyTo3D(customImage, imgTransform);
        }
        if (typeof render2DCanvas === 'function') render2DCanvas();
      };
    }

    if (borderColorPicker) {
      borderColorPicker.oninput = (e) => {
        outlineColor = e.target.value;
        if (typeof render2DCanvas === 'function') render2DCanvas();
      };
    }
  }

  function injectArtEditorPanel() {
    const editorPanel = document.getElementById('panel_r_0_1');
    if (!editorPanel) return;

    const container = editorPanel.querySelector('.ColorwayEditor_container__ciz9V') || editorPanel;
    if (!container) return;

    // Remove legacy sidebar tab if present
    const oldTab = document.getElementById('keysim-nav-art-tab');
    if (oldTab) oldTab.remove();

    // Target the Advanced wrapper so that Custom 2D Art is ALWAYS 2nd from the top
    const advWrapper = container.querySelector('[class*="advancedWrapper"]') ||
                       Array.from(container.children).find(c => {
                         const h = c.querySelector('header');
                         return h && (h.innerText || '').toUpperCase().includes('ADVANCED');
                       });

    let artSection = document.getElementById('keysim-art-editor-panel');
    if (artSection) {
      if (advWrapper && artSection.nextElementSibling !== advWrapper) {
        container.insertBefore(artSection, advWrapper);
      }
      return;
    }

    artSection = document.createElement('section');
    artSection.id = 'keysim-art-editor-panel';
    artSection.className = 'CollapsibleSection_section__zRkc7';
    artSection.setAttribute('aria-label', 'Section Custom 2D Art');

    artSection.innerHTML = `
      <header tabindex="0" id="art-panel-header" style="cursor: pointer; user-select: none;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>Custom Art</span>
          <span id="art-panel-status-pill" style="font-size: 10px; padding: 2px 7px; border-radius: 10px; background: rgba(255,255,255,0.08); color: #94a3b8; font-weight: 600; text-transform: none; letter-spacing: 0; border: 1px solid transparent;">No Image</span>
        </div>
        <div id="art-panel-collapse-icon" style="display: flex; align-items: center;">
          <svg viewBox="0 0 20 20" fill="currentColor" class="plus w-6 h-6" style="width: 20px; height: 20px;">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
          </svg>
        </div>
      </header>

      <div id="art-panel-body" style="display: none; flex-direction: column; gap: 12px; margin-top: 14px;">
        <!-- Hidden file input -->
        <input type="file" id="art-panel-file-input" accept="image/*" style="display:none;" />

        <!-- Upload Dropzone / Loaded State Card -->
        <div id="art-panel-upload-zone" style="
          border: 1.5px dashed rgba(255, 255, 255, 0.22);
          border-radius: 8px;
          background: rgba(18, 18, 30, 0.65);
          padding: 14px 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        ">
          <!-- Populated by updateArtPanelState() -->
        </div>

        <!-- Primary Action: Open Full 2D Editor Modal -->
        <button type="button" id="art-panel-btn-open-editor" style="
          width: 100%;
          padding: 10px 14px;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #ffffff;
          border: none;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
          transition: all 0.15s ease;
        ">
          <svg style="width:16px; height:16px;" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <span>Open 2D Art Editor</span>
        </button>

        <!-- Secondary Actions Row: Apply to 3D & Export PDF -->
        <div style="display: flex; gap: 8px;">
          <button type="button" id="art-panel-btn-apply" style="
            flex: 1;
            padding: 8px 10px;
            background: #0d9488;
            color: #ffffff;
            border: 1px solid #14b8a6;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s ease;
          ">
            <svg style="width:14px; height:14px;" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
            </svg>
            <span>Apply to 3D</span>
          </button>
          
          <button type="button" id="art-panel-btn-export" style="
            flex: 1;
            padding: 8px 10px;
            background: #1e293b;
            color: #e2e8f0;
            border: 1px solid #334155;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s ease;
          ">
            <svg style="width:14px; height:14px;" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            <span>Export PDF</span>
          </button>
        </div>

        <!-- Quick Transform & Controls -->
        <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px;">Quick Adjust</span>
            <span id="art-panel-toast" style="font-size: 11px; font-weight: 600; color: #10b981; min-height: 14px;"></span>
          </div>

          <!-- Buttons: Fit, Center, Rotate -->
          <div style="display: flex; gap: 6px;">
            <button type="button" id="art-panel-btn-fit" style="
              flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 600;
              background: #1e293b; color: #cbd5e1; border: 1px solid #334155;
              border-radius: 5px; cursor: pointer;
            ">Fit Keyboard</button>
            <button type="button" id="art-panel-btn-center" style="
              flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 600;
              background: #1e293b; color: #cbd5e1; border: 1px solid #334155;
              border-radius: 5px; cursor: pointer;
            ">Center</button>
            <button type="button" id="art-panel-btn-rot" style="
              flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 600;
              background: #1e293b; color: #cbd5e1; border: 1px solid #334155;
              border-radius: 5px; cursor: pointer;
            ">Rotate 90°</button>
          </div>

          <!-- Color pickers: Legend & Border -->
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <div style="flex: 1; display: flex; align-items: center; justify-content: space-between; background: #0b0f19; padding: 4px 8px; border-radius: 5px; border: 1px solid #1e293b;">
              <span style="font-size: 11px; color: #cbd5e1;">Legend Color</span>
              <input type="color" id="art-panel-legend-color" value="${legendColor || '#ffffff'}" style="width: 22px; height: 18px; border: none; background: transparent; cursor: pointer;" />
            </div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: space-between; background: #0b0f19; padding: 4px 8px; border-radius: 5px; border: 1px solid #1e293b;">
              <span style="font-size: 11px; color: #cbd5e1;">Cut Border</span>
              <input type="color" id="art-panel-border-color" value="#ffffff" style="width: 22px; height: 18px; border: none; background: transparent; cursor: pointer;" />
            </div>
          </div>
        </div>
      </div>
    `;

    if (advWrapper) {
      container.insertBefore(artSection, advWrapper);
    } else {
      container.appendChild(artSection);
    }

    bindArtPanelEvents(artSection);
    updateArtPanelState();
  }

  // 9. LISTEN FOR POSTMESSAGES FROM PARENT (KeyHM)
  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'KEYSIM_APPLY_RENDER_SETTINGS' && data.settings) {
      if (typeof currentLighting === 'object') {
        currentLighting = Object.assign({}, currentLighting, data.settings);
        if (typeof saveUserCustomLighting === 'function') saveUserCustomLighting();
        if (typeof syncInputs === 'function') syncInputs();
        if (typeof applyLiveLighting === 'function') applyLiveLighting(currentLighting);
      }
    }
    if (data.type === 'KEYSIM_LOAD_IMAGE') {
      if (data.dataUrl) {
        window.loadCustomImageFromUrl(data.dataUrl);
      } else {
        window.openKeycapArtEditor();
      }
    } else if (data.type === 'KEYSIM_EXPORT_PDF') {
      window.exportPrintPdf();
    } else if (data.type === 'KEYSIM_OPEN_2D_EDITOR') {
      window.openKeycapArtEditor();
    }
  });


  // 10. 3D LIGHT SETTING PANEL IN TEST TAB (LIVE / HOT ADJUSTMENT)
  window.initTestTabLightPanel = initTestTabLightPanel;
  function initTestTabLightPanel() {
    // Prevent typing speed test textarea from stealing scroll when switching to TEST tab
    try {
      const origFocus = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function(opts) {
        if (this && (this.className || '').toString().includes('TestingPane')) {
          origFocus.call(this, Object.assign({}, opts, { preventScroll: true }));
        } else {
          origFocus.apply(this, arguments);
        }
      };
    } catch (e) {}

    function saveUserCustomLighting() {
      try {
        localStorage.setItem('keysim_render_settings', JSON.stringify(currentLighting));
      } catch (e) {}
    }

    // Inject typography and styles synchronized with main website
    if (!document.getElementById('keysim-light-custom-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'keysim-light-custom-styles';
      styleEl.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');

        #keysim-3d-light-panel,
        #custom-image-editor-modal,
        #keycap-art-editor-root,
        .light-card,
        .preset-btn {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
        }

        .panel-heading,
        .light-card-title,
        .section-subheading {
          font-family: 'Outfit', 'Inter', sans-serif !important;
          letter-spacing: 0.4px !important;
        }

        .light-num-input,
        .light-desc,
        .mono-val,
        [id^="hex-"] {
          font-family: 'JetBrains Mono', monospace !important;
        }

        .react-tabs__tab-list {
          display: flex !important;
          align-items: center !important;
          flex-wrap: nowrap !important;
          overflow: hidden !important;
        }
        .react-tabs__tab {
          font-size: 75% !important;
          white-space: nowrap !important;
          padding: 8px 10px !important;
          letter-spacing: 0.5px !important;
          font-family: 'Outfit', 'Inter', sans-serif !important;
        }
        .react-tabs__tab-panel {
          display: none !important;
        }
        .react-tabs__tab-panel.react-tabs__tab-panel--selected {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 1 0% !important;
          min-height: 0 !important;
          height: 100% !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          overscroll-behavior: contain !important;
          scrollbar-width: thin !important;
          scrollbar-color: #475569 #0f172a !important;
        }
        .react-tabs__tab-panel.react-tabs__tab-panel--selected::-webkit-scrollbar {
          width: 6px !important;
        }
        .react-tabs__tab-panel.react-tabs__tab-panel--selected::-webkit-scrollbar-track {
          background: #0f172a !important;
        }
        .react-tabs__tab-panel.react-tabs__tab-panel--selected::-webkit-scrollbar-thumb {
          background: #475569 !important;
          border-radius: 3px !important;
        }
        .react-tabs__tab-panel.react-tabs__tab-panel--selected::-webkit-scrollbar-thumb:hover {
          background: #64748b !important;
        }

        #light-panel-header:hover #light-panel-toggle-btn {
          color: #38bdf8 !important;
        }
        #light-panel-toggle-btn:hover {
          background: rgba(56, 189, 248, 0.15) !important;
          color: #38bdf8 !important;
        }

        .light-card {
          background: #0c0c14 !important;
          border: 1px solid #1e293b !important;
          border-radius: 10px !important;
          padding: 10px 12px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          transition: border-color 0.2s !important;
        }
        .light-card:hover {
          border-color: #38bdf8 !important;
        }
        .light-num-input {
          width: 60px !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          background: #080810 !important;
          border: 1px solid #334155 !important;
          text-align: right !important;
          font-size: 11px !important;
          color: #38bdf8 !important;
          font-weight: 600 !important;
          outline: none !important;
        }
        .light-num-input:focus {
          border-color: #38bdf8 !important;
        }
        .light-range-slider {
          accent-color: #38bdf8 !important;
          cursor: pointer !important;
          width: 100% !important;
          height: 6px !important;
          margin: 4px 0 !important;
        }
        .light-desc {
          font-size: 10px !important;
          color: #64748b !important;
          line-height: 1.25 !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    const defaultLighting = {
      // 1. Sun / Key Light
      primaryIntensity: 1.00,
      primaryColor: '#fffdf5',
      sunAngle: -60,
      sunHeight: 6.0,

      // 2. Secondary / Fill Light
      secIntensity: 0.80,
      secColor: '#dbeafe',
      secAngle: -5,
      secHeight: 7.0,

      // 3. Ambient Light
      ambientIntensity: 0.10,
      ambientColor: '#ffffff',

      // Tone & Post-Processing
      lightIntensity: 1.00,
      brightness: 1.00,
      contrast: 1.25,
      hue: 0,
      saturation: 1.00,
      lightness: 1.00
    };

    let currentLighting = Object.assign({}, defaultLighting);
    try {
      const saved = localStorage.getItem('keysim_render_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          currentLighting = Object.assign({}, currentLighting, parsed);
          if (currentLighting.ambientIntensity == null && currentLighting.lightIntensity != null) {
            currentLighting.ambientIntensity = currentLighting.lightIntensity;
          }
          if (currentLighting.primaryIntensity == null && currentLighting.lightIntensity != null) {
            currentLighting.primaryIntensity = currentLighting.lightIntensity;
          }
          if (currentLighting.sunAngle == null) currentLighting.sunAngle = -60;
          if (currentLighting.sunHeight == null) currentLighting.sunHeight = 6.0;
          if (currentLighting.secIntensity == null) currentLighting.secIntensity = 0.80;
          if (currentLighting.secColor == null) currentLighting.secColor = '#dbeafe';
          if (currentLighting.secAngle == null) currentLighting.secAngle = -5;
          if (currentLighting.secHeight == null) currentLighting.secHeight = 7.0;
          if (currentLighting.ambientIntensity == null) currentLighting.ambientIntensity = 0.10;
          if (currentLighting.brightness == null) currentLighting.brightness = 1.00;
          if (currentLighting.contrast == null) currentLighting.contrast = 1.25;
          if (currentLighting.saturation == null) currentLighting.saturation = 1.00;
          if (currentLighting.lightness == null) currentLighting.lightness = 1.00;
        }
      }
    } catch (e) {}

    const toneFields = [
      { key: 'brightness', label: 'Brightness', min: 0.1, max: 3.0, step: 0.05, unit: 'x', decimals: 2, desc: 'Overall shader exposure and canvas brightness' },
      { key: 'contrast', label: 'Contrast', min: 0.1, max: 3.0, step: 0.05, unit: 'x', decimals: 2, desc: 'Tone separation between highlights and shadows' },
      { key: 'hue', label: 'Hue Shift', min: -180, max: 180, step: 1, unit: '°', decimals: 0, desc: 'Color wheel rotation applied to 3D materials' },
      { key: 'saturation', label: 'Saturation', min: 0.0, max: 3.0, step: 0.05, unit: 'x', decimals: 2, desc: 'Color vibrance and intensity of keycap pigments' },
      { key: 'lightness', label: 'Lightness', min: 0.1, max: 3.0, step: 0.05, unit: 'x', decimals: 2, desc: 'Diffuse and ambient luminance level' },
    ];

    function applyLiveLighting(settings) {
      if (typeof window.applyRenderSettings === 'function') {
        window.applyRenderSettings(settings);
      } else if (window.ThreeApp && typeof window.ThreeApp.applyRenderSettings === 'function') {
        window.ThreeApp.applyRenderSettings(settings);
      }

      if (window.ThreeApp && window.ThreeApp.lights && window.ThreeApp.baseLightIntensity) {
        // 1. Ambient Light
        const ambMult = Number.isFinite(Number(settings.ambientIntensity))
          ? Number(settings.ambientIntensity)
          : (Number.isFinite(Number(settings.lightIntensity)) ? Number(settings.lightIntensity) : defaultLighting.ambientIntensity);

        if (window.ThreeApp.lights.ambient) {
          window.ThreeApp.lights.ambient.intensity = window.ThreeApp.baseLightIntensity.ambient * ambMult;
          if (settings.ambientColor && window.ThreeApp.lights.ambient.color) {
            try { window.ThreeApp.lights.ambient.color.set(settings.ambientColor); } catch (e) {}
          }
        }

        // 2. Sun / Key Light
        const primMult = Number.isFinite(Number(settings.primaryIntensity))
          ? Number(settings.primaryIntensity)
          : (Number.isFinite(Number(settings.lightIntensity)) ? Number(settings.lightIntensity) : defaultLighting.primaryIntensity);

        if (window.ThreeApp.lights.primary) {
          window.ThreeApp.lights.primary.intensity = window.ThreeApp.baseLightIntensity.primary * primMult;
          if (settings.primaryColor && window.ThreeApp.lights.primary.color) {
            try { window.ThreeApp.lights.primary.color.set(settings.primaryColor); } catch (e) {}
          }

          const sunAngle = Number.isFinite(Number(settings.sunAngle)) ? Number(settings.sunAngle) : -60;
          const sunHeight = Number.isFinite(Number(settings.sunHeight)) ? Number(settings.sunHeight) : 6;
          const sunDist = 18;
          const sunRad = (sunAngle * Math.PI) / 180;
          window.ThreeApp.lights.primary.position.x = sunDist * Math.sin(sunRad);
          window.ThreeApp.lights.primary.position.y = sunHeight;
          window.ThreeApp.lights.primary.position.z = sunDist * Math.cos(sunRad);
        }

        // 3. Secondary / Fill Light (shadow light)
        const secMult = Number.isFinite(Number(settings.secIntensity))
          ? Number(settings.secIntensity)
          : defaultLighting.secIntensity;

        if (window.ThreeApp.lights.shadow) {
          window.ThreeApp.lights.shadow.intensity = window.ThreeApp.baseLightIntensity.shadow * secMult;
          if (settings.secColor && window.ThreeApp.lights.shadow.color) {
            try { window.ThreeApp.lights.shadow.color.set(settings.secColor); } catch (e) {}
          }

          const secAngle = Number.isFinite(Number(settings.secAngle)) ? Number(settings.secAngle) : -5;
          const secHeight = Number.isFinite(Number(settings.secHeight)) ? Number(settings.secHeight) : 7;
          const secDist = 14;
          const secRad = (secAngle * Math.PI) / 180;
          window.ThreeApp.lights.shadow.position.x = secDist * Math.sin(secRad);
          window.ThreeApp.lights.shadow.position.y = secHeight;
          window.ThreeApp.lights.shadow.position.z = secDist * Math.cos(secRad);
        }

        // 4. Top Light
        if (window.ThreeApp.lights.top) {
          window.ThreeApp.lights.top.intensity = window.ThreeApp.baseLightIntensity.top * primMult;
        }
      }

      if (window.ThreeApp && window.ThreeApp.renderer && window.ThreeApp.renderer.domElement) {
        const b = Number.isFinite(Number(settings.brightness)) ? Number(settings.brightness) : 1.00;
        const c = Number.isFinite(Number(settings.contrast)) ? Number(settings.contrast) : 1.25;
        const h = Number.isFinite(Number(settings.hue)) ? Number(settings.hue) : 0;
        const s = Number.isFinite(Number(settings.saturation)) ? Number(settings.saturation) : 1.00;
        const l = Number.isFinite(Number(settings.lightness)) ? Number(settings.lightness) : 1.00;
        window.ThreeApp.renderer.domElement.style.filter = `brightness(${b}) brightness(${l}) contrast(${c}) saturate(${s}) hue-rotate(${h}deg)`;
      }
    }

    // Apply lighting immediately without delay
    applyLiveLighting(currentLighting);
    window.applyLiveLighting = applyLiveLighting;

    function injectPanel() {
      const testPanel = document.getElementById('panel_r_0_2') || 
                        Array.from(document.querySelectorAll('.react-tabs__tab-panel')).find(p => {
                          const id = p.id || '';
                          return id.endsWith('_2') || p.innerText.includes('TYPING SPEED TEST') || p.innerText.includes('Typing Speed Test');
                        });

      if (!testPanel) return;

      testPanel.style.overflowY = 'auto';
      testPanel.style.maxHeight = 'calc(100vh - 65px)';
      testPanel.style.paddingRight = '6px';
      testPanel.style.paddingBottom = '36px';

      if (testPanel.querySelector('#keysim-3d-light-panel')) {
        return;
      }

      const section = document.createElement('section');
      section.id = 'keysim-3d-light-panel';
      section.className = 'CollapsibleSection_section__zRkc7';
      section.style.marginBottom = '20px';
      section.style.borderBottom = '1px solid rgba(255,255,255,0.12)';
      section.style.paddingBottom = '18px';

      const toneHtml = toneFields.map(f => {
        const val = currentLighting[f.key] != null ? currentLighting[f.key] : (f.key === 'hue' ? 0 : 1);
        const formatted = f.decimals === 0 ? Math.round(val) : Number(val).toFixed(f.decimals);
        return `
          <div class="light-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="light-card-title" style="font-size:12px; font-weight:600; color:#f8fafc;">${f.label}</span>
              <div style="display:flex; align-items:center; gap:3px;">
                <input type="number" id="num-${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" value="${formatted}" class="light-num-input" />
                <span class="mono-val" style="font-size:11px; color:#94a3b8; min-width:14px; text-align:center;">${f.unit}</span>
              </div>
            </div>
            <input type="range" id="slider-${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" value="${val}" class="light-range-slider" />
            <div class="light-desc">${f.desc}</div>
          </div>
        `;
      }).join('');

      section.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Top Header -->
          <div id="light-panel-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
            <div>
              <div class="panel-heading" style="font-weight: 700; font-size: 13px; color: #fff; text-transform: uppercase; letter-spacing: 0.8px;">
                3D Light Setting
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.35; margin-top: 3px;">
                Dual directional lights (angle & elevation) + ambient & tone curve.
              </div>
            </div>
            <div id="light-panel-toggle-btn" title="Collapse" aria-expanded="true" style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; color: #94a3b8; border-radius: 4px; cursor: pointer; transition: color 0.15s, background 0.15s; flex-shrink: 0;">
              <svg viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px; display: block;"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
            </div>
          </div>

          <!-- Top Action Buttons -->
          <div style="display: flex; gap: 8px;">
            <button type="button" id="btn-reset-light" style="flex: 1; padding: 7px 10px; font-size: 11px; font-weight: 600; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 6px; cursor: pointer; transition: all 0.15s;">Reset Defaults</button>
            <button type="button" id="btn-save-light" style="flex: 1.4; padding: 7px 10px; font-size: 11px; font-weight: 700; background: #0ea5e9; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 5px;">Save Settings</button>
          </div>
          <div id="light-toast-msg" class="mono-val" style="font-size: 11px; text-align: center; color: #10b981; min-height: 14px; font-weight: 600;"></div>

          <!-- Collapsible Body -->
          <div id="light-panel-body" style="display: flex; flex-direction: column; gap: 8px;">
            
            <!-- Section 1: Sun / Key Light -->
            <div class="section-subheading" style="font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px;">Directional Light Sources</div>
            
            <!-- Sun / Key Light Card -->
            <div class="light-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="light-card-title" style="font-size:12px; font-weight:700; color:#f8fafc;">Sun / Key Light</span>
                <div style="display:flex; align-items:center; gap:6px; background:#080810; padding:2px 6px; border-radius:6px; border:1px solid #1e293b;">
                  <span id="hex-primaryColor" class="mono-val" style="font-size:11px; color:#cbd5e1;">${currentLighting.primaryColor}</span>
                  <input type="color" id="picker-primaryColor" value="${currentLighting.primaryColor}" style="width:24px; height:20px; border:none; border-radius:3px; cursor:pointer; background:transparent;" />
                </div>
              </div>

              <!-- Intensity -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <span style="font-size:11px; color:#cbd5e1;">Intensity</span>
                <div style="display:flex; align-items:center; gap:3px;">
                  <input type="number" id="num-primaryIntensity" min="0.1" max="3.0" step="0.05" value="${Number(currentLighting.primaryIntensity).toFixed(2)}" class="light-num-input" />
                  <span class="mono-val" style="font-size:11px; color:#94a3b8; min-width:14px; text-align:center;">x</span>
                </div>
              </div>
              <input type="range" id="slider-primaryIntensity" min="0.1" max="3.0" step="0.05" value="${currentLighting.primaryIntensity}" class="light-range-slider" />

              <!-- Angle -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <span style="font-size:11px; color:#cbd5e1;">Horizontal Angle</span>
                <div style="display:flex; align-items:center; gap:3px;">
                  <input type="number" id="num-sunAngle" min="-180" max="180" step="1" value="${Math.round(currentLighting.sunAngle)}" class="light-num-input" />
                  <span class="mono-val" style="font-size:11px; color:#94a3b8; min-width:14px; text-align:center;">°</span>
                </div>
              </div>
              <input type="range" id="slider-sunAngle" min="-180" max="180" step="1" value="${currentLighting.sunAngle}" class="light-range-slider" />

              <!-- Height -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <span style="font-size:11px; color:#cbd5e1;">Elevation Height</span>
                <div style="display:flex; align-items:center; gap:3px;">
                  <input type="number" id="num-sunHeight" min="2" max="35" step="0.5" value="${Number(currentLighting.sunHeight).toFixed(1)}" class="light-num-input" />
                  <span class="mono-val" style="font-size:11px; color:#94a3b8; min-width:14px; text-align:center;">m</span>
                </div>
              </div>
              <input type="range" id="slider-sunHeight" min="2" max="35" step="0.5" value="${currentLighting.sunHeight}" class="light-range-slider" />

              <div class="light-desc">Primary sun position, azimuth rotation & elevation height</div>
            </div>

            <!-- Secondary / Fill Light Card -->
            <div class="light-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="light-card-title" style="font-size:12px; font-weight:700; color:#f8fafc;">Secondary / Fill Light</span>
                <div style="display:flex; align-items:center; gap:6px; background:#080810; padding:2px 6px; border-radius:6px; border:1px solid #1e293b;">
                  <span id="hex-secColor" class="mono-val" style="font-size:11px; color:#cbd5e1;">${currentLighting.secColor}</span>
                  <input type="color" id="picker-secColor" value="${currentLighting.secColor}" style="width:24px; height:20px; border:none; border-radius:3px; cursor:pointer; background:transparent;" />
                </div>
              </div>

              <!-- Intensity -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <span style="font-size:11px; color:#cbd5e1;">Intensity</span>
                <div style="display:flex; align-items:center; gap:3px;">
                  <input type="number" id="num-secIntensity" min="0.0" max="3.0" step="0.05" value="${Number(currentLighting.secIntensity).toFixed(2)}" class="light-num-input" />
                  <span class="mono-val" style="font-size:11px; color:#94a3b8; min-width:14px; text-align:center;">x</span>
                </div>
              </div>
              <input type="range" id="slider-secIntensity" min="0.0" max="3.0" step="0.05" value="${currentLighting.secIntensity}" class="light-range-slider" />

              <!-- Angle -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <span style="font-size:11px; color:#cbd5e1;">Horizontal Angle</span>
                <div style="display:flex; align-items:center; gap:3px;">
                  <input type="number" id="num-secAngle" min="-180" max="180" step="1" value="${Math.round(currentLighting.secAngle)}" class="light-num-input" />
                  <span class="mono-val" style="font-size:11px; color:#94a3b8; min-width:14px; text-align:center;">°</span>
                </div>
              </div>
              <input type="range" id="slider-secAngle" min="-180" max="180" step="1" value="${currentLighting.secAngle}" class="light-range-slider" />

              <!-- Height -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <span style="font-size:11px; color:#cbd5e1;">Elevation Height</span>
                <div style="display:flex; align-items:center; gap:3px;">
                  <input type="number" id="num-secHeight" min="2" max="35" step="0.5" value="${Number(currentLighting.secHeight).toFixed(1)}" class="light-num-input" />
                  <span class="mono-val" style="font-size:11px; color:#94a3b8; min-width:14px; text-align:center;">m</span>
                </div>
              </div>
              <input type="range" id="slider-secHeight" min="2" max="35" step="0.5" value="${currentLighting.secHeight}" class="light-range-slider" />

              <div class="light-desc">Secondary fill light color, shadow fill angle & elevation</div>
            </div>

            <!-- Ambient Light Card -->
            <div class="light-card">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="light-card-title" style="font-size:12px; font-weight:700; color:#f8fafc;">Ambient Light</span>
                <div style="display:flex; align-items:center; gap:6px; background:#080810; padding:2px 6px; border-radius:6px; border:1px solid #1e293b;">
                  <span id="hex-ambientColor" class="mono-val" style="font-size:11px; color:#cbd5e1;">${currentLighting.ambientColor}</span>
                  <input type="color" id="picker-ambientColor" value="${currentLighting.ambientColor}" style="width:24px; height:20px; border:none; border-radius:3px; cursor:pointer; background:transparent;" />
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <span style="font-size:11px; color:#cbd5e1;">Intensity</span>
                <div style="display:flex; align-items:center; gap:3px;">
                  <input type="number" id="num-ambientIntensity" min="0.1" max="3.0" step="0.05" value="${Number(currentLighting.ambientIntensity).toFixed(2)}" class="light-num-input" />
                  <span class="mono-val" style="font-size:11px; color:#94a3b8; min-width:14px; text-align:center;">x</span>
                </div>
              </div>
              <input type="range" id="slider-ambientIntensity" min="0.1" max="3.0" step="0.05" value="${currentLighting.ambientIntensity}" class="light-range-slider" />
              <div class="light-desc">Diffuse 360° ambient environmental light across scene</div>
            </div>

            <!-- Section 2: Tone & Shader Post-Processing -->
            <div class="section-subheading" style="font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px;">Tone & Post-Processing</div>
            ${toneHtml}

            <!-- Section 3: Presets -->
            <div class="light-card" style="gap: 8px; margin-top: 2px;">
              <div class="section-subheading" style="font-size: 11px; font-weight: 700; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">Lighting Presets</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <button type="button" class="preset-btn" data-preset="studio" style="padding: 7px 8px; font-size: 11px; font-weight: 600; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px; cursor: pointer;">Studio Clean</button>
                <button type="button" class="preset-btn" data-preset="warm" style="padding: 7px 8px; font-size: 11px; font-weight: 600; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px; cursor: pointer;">Warm Sunset</button>
                <button type="button" class="preset-btn" data-preset="vibrant" style="padding: 7px 8px; font-size: 11px; font-weight: 600; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px; cursor: pointer;">Vibrant Pop</button>
                <button type="button" class="preset-btn" data-preset="cyberpunk" style="padding: 7px 8px; font-size: 11px; font-weight: 600; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px; cursor: pointer;">Cyberpunk</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Insert at the VERY TOP of the TEST tab
      if (testPanel.firstChild) {
        testPanel.insertBefore(section, testPanel.firstChild);
      } else {
        testPanel.appendChild(section);
      }

      testPanel.scrollTop = 0;

      const header = section.querySelector('#light-panel-header');
      const body = section.querySelector('#light-panel-body');
      const toggleBtn = section.querySelector('#light-panel-toggle-btn');
      
      const SVG_PLUS = '<svg viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px; display: block;"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path></svg>';
      const SVG_MINUS = '<svg viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px; display: block;"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>';

      let isCollapsed = false;

      function updateToggleState() {
        body.style.display = isCollapsed ? 'none' : 'flex';
        if (toggleBtn) {
          toggleBtn.innerHTML = isCollapsed ? SVG_PLUS : SVG_MINUS;
          toggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
          toggleBtn.setAttribute('title', isCollapsed ? 'Expand' : 'Collapse');
        }
      }

      if (header) {
        header.onclick = () => {
          isCollapsed = !isCollapsed;
          updateToggleState();
        };
      }

      // Helper function to bind numeric input and range slider bi-directionally
      function bindControl(key, min, max, decimals = 2, defaultVal = 1.0) {
        const slider = section.querySelector(`#slider-${key}`);
        const numInput = section.querySelector(`#num-${key}`);
        if (!slider || !numInput) return;

        slider.oninput = (e) => {
          const val = parseFloat(e.target.value);
          currentLighting[key] = val;
          numInput.value = decimals === 0 ? Math.round(val) : val.toFixed(decimals);
          applyLiveLighting(currentLighting);
          saveUserCustomLighting();
        };

        numInput.oninput = (e) => {
          let val = parseFloat(e.target.value);
          if (!isNaN(val)) {
            val = Math.max(min, Math.min(max, val));
            currentLighting[key] = val;
            slider.value = val;
            applyLiveLighting(currentLighting);
            saveUserCustomLighting();
          }
        };

        numInput.onblur = () => {
          let val = parseFloat(numInput.value);
          if (isNaN(val)) val = defaultLighting[key] != null ? defaultLighting[key] : defaultVal;
          val = Math.max(min, Math.min(max, val));
          currentLighting[key] = val;
          numInput.value = decimals === 0 ? Math.round(val) : val.toFixed(decimals);
          slider.value = val;
          applyLiveLighting(currentLighting);
          saveUserCustomLighting();
        };
      }

      // Helper to bind color picker and hex display
      function bindColor(key) {
        const picker = section.querySelector(`#picker-${key}`);
        const hex = section.querySelector(`#hex-${key}`);
        if (picker && hex) {
          picker.oninput = (e) => {
            currentLighting[key] = e.target.value;
            hex.textContent = e.target.value;
            applyLiveLighting(currentLighting);
            saveUserCustomLighting();
          };
        }
      }

      // Bind all light controls
      bindControl('primaryIntensity', 0.1, 3.0, 2, 1.00);
      bindControl('sunAngle', -180, 180, 0, -60);
      bindControl('sunHeight', 2, 35, 1, 6.0);
      bindColor('primaryColor');

      bindControl('secIntensity', 0.0, 3.0, 2, 0.80);
      bindControl('secAngle', -180, 180, 0, -5);
      bindControl('secHeight', 2, 35, 1, 7.0);
      bindColor('secColor');

      bindControl('ambientIntensity', 0.1, 3.0, 2, 0.10);
      bindColor('ambientColor');

      // Bind tone fields
      toneFields.forEach(f => {
        bindControl(f.key, f.min, f.max, f.decimals, defaultLighting[f.key]);
      });

      const presets = {
        studio: {
          primaryIntensity: 1.00, primaryColor: '#fffdf5', sunAngle: -60, sunHeight: 6.0,
          secIntensity: 0.80, secColor: '#dbeafe', secAngle: -5, secHeight: 7.0,
          ambientIntensity: 0.10, ambientColor: '#ffffff',
          brightness: 1.00, contrast: 1.25, hue: 0, saturation: 1.00, lightness: 1.00
        },
        warm: {
          primaryIntensity: 1.50, primaryColor: '#ffe8cc', sunAngle: 65, sunHeight: 5.5,
          secIntensity: 0.70, secColor: '#fed7aa', secAngle: -115, secHeight: 5.0,
          ambientIntensity: 1.10, ambientColor: '#fff5ea',
          brightness: 1.10, contrast: 1.10, hue: 15, saturation: 1.30, lightness: 1.05
        },
        vibrant: {
          primaryIntensity: 1.50, primaryColor: '#ffffff', sunAngle: 45, sunHeight: 16.0,
          secIntensity: 1.00, secColor: '#e2e8f0', secAngle: -135, secHeight: 10.0,
          ambientIntensity: 1.30, ambientColor: '#ffffff',
          brightness: 1.12, contrast: 1.25, hue: 0, saturation: 1.55, lightness: 1.05
        },
        cyberpunk: {
          primaryIntensity: 1.55, primaryColor: '#38bdf8', sunAngle: 70, sunHeight: 10.0,
          secIntensity: 1.25, secColor: '#ec4899', secAngle: -110, secHeight: 8.0,
          ambientIntensity: 1.15, ambientColor: '#d8b4fe',
          brightness: 1.00, contrast: 1.35, hue: -25, saturation: 1.60, lightness: 0.95
        }
      };

      function syncInputs() {
        const syncSingle = (key, decimals = 2) => {
          const s = section.querySelector(`#slider-${key}`);
          const n = section.querySelector(`#num-${key}`);
          const val = currentLighting[key];
          if (s && val != null) s.value = val;
          if (n && val != null) n.value = decimals === 0 ? Math.round(val) : Number(val).toFixed(decimals);
        };

        const syncCol = (key) => {
          const p = section.querySelector(`#picker-${key}`);
          const h = section.querySelector(`#hex-${key}`);
          const val = currentLighting[key];
          if (p && val) p.value = val;
          if (h && val) h.textContent = val;
        };

        syncSingle('primaryIntensity', 2);
        syncSingle('sunAngle', 0);
        syncSingle('sunHeight', 1);
        syncCol('primaryColor');

        syncSingle('secIntensity', 2);
        syncSingle('secAngle', 0);
        syncSingle('secHeight', 1);
        syncCol('secColor');

        syncSingle('ambientIntensity', 2);
        syncCol('ambientColor');

        toneFields.forEach(f => {
          syncSingle(f.key, f.decimals);
        });
      }

      section.querySelectorAll('.preset-btn').forEach(btn => {
        btn.onclick = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          const p = presets[btn.dataset.preset];
          if (!p) return;
          currentLighting = Object.assign({}, currentLighting, p);
          syncInputs();
          applyLiveLighting(currentLighting);
          saveUserCustomLighting();
        };
      });

      const btnReset = section.querySelector('#btn-reset-light');
      if (btnReset) {
        btnReset.onclick = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          currentLighting = Object.assign({}, defaultLighting);
          try {
            localStorage.removeItem('keysim_render_settings');
          } catch (err) {}
          syncInputs();
          applyLiveLighting(currentLighting);
          showLightToast('Reset to VPS defaults');
        };
      }

      const btnSave = section.querySelector('#btn-save-light');
      const toastMsg = section.querySelector('#light-toast-msg');
      function showLightToast(msg) {
        if (toastMsg) {
          toastMsg.textContent = msg;
          setTimeout(() => { toastMsg.textContent = ''; }, 3500);
        }
      }

      if (btnSave) {
        btnSave.onclick = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          const amb = currentLighting.ambientIntensity != null ? currentLighting.ambientIntensity : 1.25;
          const prim = currentLighting.primaryIntensity != null ? currentLighting.primaryIntensity : 1.25;
          currentLighting.lightIntensity = parseFloat(((amb + prim) / 2).toFixed(2));

          try {
            localStorage.setItem('keysim_render_settings', JSON.stringify(currentLighting));
          } catch (e) {}
          fetch('/api/render-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentLighting)
          }).catch(() => {});
          showLightToast('Render settings saved successfully!');
        };
      }
    }

    function setupTabClickReset() {
      document.querySelectorAll('.react-tabs__tab, [role="tab"]').forEach(tab => {
        if (!tab.dataset.scrollBound && (tab.innerText || '').toUpperCase().includes('TEST')) {
          tab.dataset.scrollBound = '1';
          tab.addEventListener('click', () => {
            setTimeout(() => {
              const p = document.getElementById('panel_r_0_2');
              if (p) p.scrollTop = 0;
            }, 30);
            setTimeout(() => {
              const p = document.getElementById('panel_r_0_2');
              if (p) p.scrollTop = 0;
            }, 150);
          });
        }
      });
    }

    const observer = new MutationObserver(() => {
      injectPanel();
      injectArtEditorPanel();
      setupTabClickReset();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    injectPanel();
    injectArtEditorPanel();
    setupTabClickReset();
  }

  // Init UI
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createEditorUI();
      injectArtEditorPanel();
      initTestTabLightPanel();
    });
  } else {
    createEditorUI();
    injectArtEditorPanel();
    initTestTabLightPanel();
  }

})();
