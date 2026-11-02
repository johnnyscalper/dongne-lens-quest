/* 동네렌즈 퀘스트 — a small, dependency-free orthographic 3D world. */
(() => {
  'use strict';

  function initJourney() {
    const root = document.getElementById('journey-scene');
    if (!root) return;
    const make = (tag, className, text) => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (text) el.textContent = text;
      return el;
    };
    const header = make('div', 'journey-header');
    const caption = make('div', 'journey-caption');
    caption.append(make('span', 'journey-eyebrow', 'YOUR NEXT CHAPTER'));
    const destination = make('span', 'journey-destination', '마음에 둔 동네로');
    destination.id = 'journey-destination';
    caption.append(destination);
    const compass = make('span', 'journey-compass', 'N');
    compass.setAttribute('aria-hidden', 'true');
    header.append(caption, compass);

    const canvas = make('canvas', 'journey-canvas');
    canvas.id = 'journey-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const description = make('p', 'sr-only', '작은 탐험가가 초록 길을 따라 입체 아파트 마을을 찾아가는 장면입니다. 실제 지도가 아닌 탐험을 표현한 그래픽입니다.');
    description.id = 'journey-description';
    root.setAttribute('aria-describedby', 'journey-description');
    const footer = make('div', 'journey-footer');
    const note = make('span', 'journey-note', 'A SMALL STEP, A BETTER HOME.');
    const toggle = make('button', 'journey-toggle');
    toggle.id = 'journey-toggle';
    toggle.type = 'button';
    footer.append(note, toggle);
    const mapNote = make('span', 'journey-map-note', '상상 속 마을 · 실제 지도 아님');
    root.replaceChildren(header, canvas, description, mapNote, footer);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.hidden = true;
      toggle.hidden = true;
      description.className = 'journey-fallback';
      return;
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let userPaused = motion.matches;
    let inView = true;
    let width = 600;
    let height = 490;
    let scale = 1;
    let yaw = 0;
    let targetYaw = 0;
    let phase = 0;
    let frame = null;
    let lastTime = 0;
    let paintTime = 0;
    const palette = {
      ground: '#e0e7d3', edge: '#96b1a0', edgeLight: '#b9cdb8',
      dark: '#174e46', mid: '#2a7061', roof: '#73a08c',
      cream: '#f7f2df', creamShade: '#cbd3bd', creamRoof: '#fffdf1',
      window: '#c9e8df', windowDark: '#3a756a', lime: '#dcf59b',
      orange: '#e99265', shadow: 'rgba(31,71,54,.10)'
    };
    const route = [
      [-143, 65], [-133, 86], [-103, 96], [-75, 87], [-60, 66],
      [-57, 42], [-44, 23], [-19, 17], [3, 19], [24, 17], [40, 3], [43, -18]
    ];
    const buildings = [
      {x: -94, z: -50, w: 55, d: 49, h: 115, front: palette.cream, side: palette.creamShade, top: palette.creamRoof, windows: palette.windowDark, floors: 6, cols: 3},
      {x: 0, z: -64, w: 64, d: 57, h: 161, front: '#397e6f', side: '#1d584e', top: '#75a58f', windows: '#c9e6ca', floors: 9, cols: 3},
      {x: 99, z: 19, w: 52, d: 47, h: 92, front: '#f0eee2', side: '#bbcbbd', top: '#fffdf4', windows: '#5c8a79', floors: 5, cols: 3}
    ];
    const trees = [
      [-145,-76,21], [-142,-9,26], [-98,32,23], [-37,-103,21],
      [68,-85,22], [128,-55,27], [139,64,21], [77,88,25], [18,87,20]
    ];

    // Rotate in world space, then project the 3D point into the canvas plane.
    function project(x, y, z) {
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const rx = x * c - z * s, rz = x * s + z * c;
      return { x: width / 2 + (rx - rz) * .80 * scale, y: height * .58 + ((rx + rz) * .40 - y) * scale };
    }
    function depth(x, z) {
      return x * (Math.cos(yaw) + Math.sin(yaw)) + z * (Math.cos(yaw) - Math.sin(yaw));
    }
    function polygon(points, fill, stroke = null, lineWidth = 1) {
      ctx.beginPath();
      points.forEach((p, i) => {
        const v = project(...p);
        if (!i) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y);
      });
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.lineWidth = lineWidth * scale; ctx.strokeStyle = stroke; ctx.stroke(); }
    }
    function line(points, color, lineWidth, dash = []) {
      ctx.beginPath();
      points.forEach((p, i) => {
        const v = project(...p);
        if (!i) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y);
      });
      ctx.lineWidth = lineWidth * scale;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(dash.map(d => d * scale));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    function box(x, y, z, w, h, d, colors) {
      const l = x - w / 2, r = x + w / 2, b = z - d / 2, f = z + d / 2;
      polygon([[l,y,b],[l,y+h,b],[r,y+h,b],[r,y,b]], colors.side);
      polygon([[l,y,f],[l,y+h,f],[r,y+h,f],[r,y,f]], colors.front);
      polygon([[r,y,b],[r,y+h,b],[r,y+h,f],[r,y,f]], colors.side);
      polygon([[l,y+h,b],[r,y+h,b],[r,y+h,f],[l,y+h,f]], colors.top);
    }
    function groundCircle(x, z, radius, fill) {
      const points = [];
      for (let i = 0; i < 36; i++) {
        const a = i / 36 * Math.PI * 2;
        points.push([x + Math.cos(a) * radius, 1, z + Math.sin(a) * radius]);
      }
      polygon(points, fill);
    }
    function ellipseScreen(point, rx, ry, fill) {
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, rx * scale, ry * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    }
    function drawBuilding(b) {
      const {x,z,w,d,h} = b;
      // A small foundation and parapet make the towers look like models.
      box(x, 1, z, w + 7, 5, d + 7, {front:'#d2dac9',side:'#b5c7b4',top:'#eaf0df'});
      box(x, 6, z, w, h, d, b);
      for (let row = 0; row < b.floors; row++) {
        const yy = 19 + row * (h - 23) / b.floors;
        for (let col = 0; col < b.cols; col++) {
          const xx = x - w / 2 + 8 + col * (w - 12) / b.cols;
          polygon([[xx,yy,z+d/2+.2],[xx,yy+8,z+d/2+.2],[xx+7,yy+8,z+d/2+.2],[xx+7,yy,z+d/2+.2]], b.windows);
          const zz = z - d / 2 + 8 + col * (d - 12) / b.cols;
          polygon([[x+w/2+.2,yy,zz],[x+w/2+.2,yy+8,zz],[x+w/2+.2,yy+8,zz+6],[x+w/2+.2,yy,zz+6]], row % 3 === 1 ? '#b3d3b5' : b.windows);
        }
      }
      box(x, h + 6, z, w + 3, 4, d + 3, {front:b.front, side:b.side, top:b.top});
      box(x - 9, h + 10, z - 4, 22, 9, 20, {front:b.front,side:b.side,top:b.top});
      const f = z + d / 2 + .4;
      polygon([[x-6,6,f],[x-6,20,f],[x+6,20,f],[x+6,6,f]], '#194e43');
      polygon([[x-9,20,f+4],[x-9,24,f-1],[x+9,24,f-1],[x+9,20,f+4]], '#dce8ca');
      // Fine roof line catches the daylight.
      line([[x-w/2,h+10,z+d/2],[x+w/2,h+10,z+d/2],[x+w/2,h+10,z-d/2]], 'rgba(255,255,255,.45)', .8);
    }
    function drawTree(tree) {
      const [x,z,h] = tree;
      box(x, 0, z, 3, h * .65, 3, {front:'#a58f64',side:'#776e4e',top:'#b9a674'});
      const colors = ['#97bd81','#739f6f','#b4d392'];
      for (let i = 0; i < 3; i++) {
        const y = h * .38 + i * h * .19, r = 13 - i * 3;
        polygon([[x-r,y,z],[x,y+h*.48,z],[x,y,z+r]], colors[0]);
        polygon([[x,y,z+r],[x,y+h*.48,z],[x+r,y,z]], colors[1]);
        polygon([[x-r,y,z],[x,y+h*.48,z],[x,y,z-r]], colors[2]);
      }
    }
    function routePosition(t) {
      const normalized = (t % 1 + 1) % 1;
      const segment = normalized * (route.length - 1);
      const index = Math.min(Math.floor(segment), route.length - 2);
      const f = segment - index;
      return {x:route[index][0] + (route[index+1][0]-route[index][0])*f, z:route[index][1] + (route[index+1][1]-route[index][1])*f};
    }
    function drawTraveller(person, time) {
      const {x,z} = person;
      groundCircle(x+2, z+2, 8, 'rgba(25,68,51,.15)');
      const step = Math.sin(time * 5) * 1.4;
      const dark = {front:'#305952',side:'#244840',top:'#4e7767'};
      box(x-3, 1, z+step, 3, 10, 4, dark);
      box(x+3, 1, z-step, 3, 10, 4, dark);
      box(x, 10, z, 10, 12, 7, {front:'#fff4cf',side:'#dac7a4',top:'#fff8df'});
      box(x-3, 11, z+5, 7, 10, 5, {front:'#e99568',side:'#b96b4d',top:'#ffc08c'});
      line([[x+7,19,z],[x+8,12,z+2]], '#dfb78d', 3);
      ellipseScreen(project(x, 28, z), 5.2, 6.2, '#e7b790');
      ellipseScreen(project(x, 32, z), 6.6, 2.9, '#286454');
      ellipseScreen(project(x, 34, z), 4.7, 3.0, '#43826a');
    }
    function drawPin(time) {
      const bob = userPaused || motion.matches ? 0 : Math.sin(time * 1.5) * 3;
      const point = project(0, 206 + bob, -64);
      ellipseScreen(project(0, 185, -64), 15, 5, 'rgba(24,70,50,.1)');
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.scale(scale, scale);
      ctx.shadowColor = 'rgba(20,62,46,.18)'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(0, 28);
      ctx.bezierCurveTo(-8,18,-19,7,-19,-4);
      ctx.arc(0,-4,19,Math.PI,0);
      ctx.bezierCurveTo(19,7,8,18,0,28);
      ctx.fillStyle = palette.lime; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#295749'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-9,-3); ctx.lineTo(0,-11); ctx.lineTo(9,-3); ctx.moveTo(-6,-5); ctx.lineTo(-6,6); ctx.lineTo(6,6); ctx.lineTo(6,-5); ctx.moveTo(-1,6); ctx.lineTo(-1,0); ctx.lineTo(2,0); ctx.lineTo(2,6); ctx.stroke();
      ctx.restore();
    }
    function render() {
      ctx.clearRect(0, 0, width, height);
      // The shadow anchors the floating model while its cut edges provide depth.
      const shadow = project(0,-35,7);
      ctx.save(); ctx.filter = 'blur(14px)';
      ellipseScreen(shadow, 175, 66, 'rgba(33,73,48,.12)');
      ctx.restore();
      box(0,-25,0,334,25,238,{front:palette.edgeLight,side:palette.edge,top:palette.ground});
      line([[-167,1,119],[167,1,119],[167,1,-119]], '#f4f6e9', 2);
      // Paving is a single path; the route never suggests a real-world map.
      line(route.map(([x,z])=>[x,2,z]), '#f7f4df', 22);
      line(route.map(([x,z])=>[x,2.4,z]), '#bfd29f', 10);
      line(route.map(([x,z])=>[x,2.6,z]), '#ffffff', 1.5, [3,7]);
      groundCircle(-143,65,11,'#f3f7de');
      groundCircle(-143,65,5,'#357362');
      groundCircle(43,-18,12,'#f4f6da');
      groundCircle(43,-18,6,'#6d9873');
      // Decorative gardens and low terrace slabs are kept below all objects.
      box(-109,1,3,37,3,18,{front:'#c1d0b2',side:'#acbea0',top:'#d1dfbf'});
      box(87,1,72,49,3,14,{front:'#c0ceaf',side:'#acbea0',top:'#d6e2c5'});
      trees.forEach(([x,z])=>groundCircle(x+3,z+4,12,palette.shadow));
      buildings.forEach(b => polygon([[b.x-b.w/2,1,b.z+b.d/2],[b.x+b.w/2+24,1,b.z+b.d/2+28],[b.x+b.w/2+24,1,b.z-b.d/2+28],[b.x+b.w/2,1,b.z-b.d/2]], palette.shadow));
      const person = routePosition(.18 + Math.sin(phase * .055) * .16 + phase * .009);
      const objects = [
        ...buildings.map(b=>({depth:depth(b.x,b.z),draw:()=>drawBuilding(b)})),
        ...trees.map(t=>({depth:depth(t[0],t[1]),draw:()=>drawTree(t)})),
        {depth:depth(person.x,person.z),draw:()=>drawTraveller(person,phase)}
      ];
      objects.sort((a,b)=>a.depth-b.depth).forEach(object=>object.draw());
      drawPin(phase);
    }
    function updateToggle() {
      toggle.textContent = userPaused ? '▶ 움직임 켜기' : 'Ⅱ 움직임 멈추기';
      toggle.setAttribute('aria-pressed', String(!userPaused));
      toggle.setAttribute('aria-label', userPaused ? '3D 마을 움직임 켜기' : '3D 마을 움직임 멈추기');
    }
    function canAnimate() { return !userPaused && inView && !document.hidden; }
    function animate(time) {
      frame = null;
      if (!canAnimate()) { lastTime = 0; return; }
      if (!lastTime) lastTime = time;
      const delta = Math.min((time-lastTime)/1000,.08);
      lastTime = time;
      phase += delta;
      yaw += (targetYaw-yaw)*Math.min(1,delta*4);
      if (time-paintTime >= 1000/30) { render(); paintTime = time; }
      frame = requestAnimationFrame(animate);
    }
    function syncAnimation() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = 0;
      if (canAnimate()) frame = requestAnimationFrame(animate);
      else render();
    }
    function resize() {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      scale = Math.min(width/560,height/520,1.45);
      render();
    }
    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      updateToggle(); syncAnimation();
    });
    root.addEventListener('pointermove', event => {
      if (motion.matches || event.pointerType === 'touch') return;
      const rect = root.getBoundingClientRect();
      targetYaw = ((event.clientX-rect.left)/rect.width-.5)*.18;
      if (userPaused) { yaw = targetYaw; render(); }
    });
    root.addEventListener('pointerleave', () => {
      targetYaw = 0;
      if (userPaused) { yaw = 0; render(); }
    });
    document.addEventListener('visibilitychange', syncAnimation);
    motion.addEventListener('change', () => {
      if (motion.matches) { userPaused = true; yaw = 0; targetYaw = 0; }
      updateToggle(); syncAnimation();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        syncAnimation();
      }, {threshold:.05}).observe(root);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(root);
    else window.addEventListener('resize', resize);
    window.addEventListener('lens:destination', event => {
      const name = typeof event.detail?.name === 'string' ? event.detail.name : '마음에 둔 동네로';
      destination.textContent = name;
      destination.title = name;
      phase = 0;
      render();
    });
    updateToggle(); resize(); syncAnimation();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initJourney, {once:true});
  else initJourney();
})();
