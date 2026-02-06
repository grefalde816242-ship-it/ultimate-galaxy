// === Scene & Camera ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 5000);
camera.position.set(0, 200, 600);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000010);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// === Load Textures from assets folder ===
const starTexture = new THREE.TextureLoader().load('assets/star.png'); // circular star sprite
const nebulaTexture = new THREE.TextureLoader().load('assets/nebula.png'); // soft nebula sprite

// === Galaxy Group ===
const galaxy = new THREE.Group();
scene.add(galaxy);

const galaxyParams = {
  starCount:15000,
  armCount:5,
  armSpread:0.35,
  radius:700
};

// Generate Spiral Galaxy Stars
function generateGalaxy(){
  const positions = [];
  const colors = [];
  const sizes = [];

  for(let i=0;i<galaxyParams.starCount;i++){
    const arm = i % galaxyParams.armCount;
    const angle = (i/galaxyParams.starCount)*Math.PI*6 + arm*(2*Math.PI/galaxyParams.armCount);
    const distance = Math.random()**0.5 * galaxyParams.radius;
    const x = Math.cos(angle)*distance + (Math.random()-0.5)*galaxyParams.armSpread*150;
    const y = (Math.random()-0.5)*50;
    const z = Math.sin(angle)*distance + (Math.random()-0.5)*galaxyParams.armSpread*150;

    positions.push(x,y,z);

    const color = new THREE.Color();
    color.setHSL(0.1 + 0.6*(distance/galaxyParams.radius),0.8,0.5);
    colors.push(color.r,color.g,color.b);

    sizes.push(1.5 + Math.random()*2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes,1));

  const material = new THREE.PointsMaterial({
    size:2.5,
    map:starTexture,
    vertexColors:true,
    transparent:true,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });

  const stars = new THREE.Points(geometry,material);
  galaxy.add(stars);
}

generateGalaxy();

// === Nebula Clouds ===
const nebulaParticles = [];
for(let i=0;i<300;i++){
  const geom = new THREE.PlaneGeometry(200,200);
  const mat = new THREE.MeshBasicMaterial({
    map:nebulaTexture,
    color:0xff33ff,
    transparent:true,
    opacity:0.05,
    blending:THREE.AdditiveBlending,
    side:THREE.DoubleSide,
    depthWrite:false
  });
  const neb = new THREE.Mesh(geom,mat);
  neb.position.set((Math.random()-0.5)*2000,(Math.random()-0.5)*200,(Math.random()-0.5)*2000);
  neb.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
  scene.add(neb);
  nebulaParticles.push(neb);
}

// === Comets with trails ===
const cometParticles = [];
function createComet(){
  const geom = new THREE.SphereGeometry(3,8,8);
  const mat = new THREE.MeshBasicMaterial({color:0xffcc00});
  const comet = new THREE.Mesh(geom,mat);
  comet.position.set((Math.random()-0.5)*1200,300,(Math.random()-0.5)*1200);
  comet.velocity = new THREE.Vector3((Math.random()-0.5)*6,-15,(Math.random()-0.5)*6);
  comet.trail=[];
  scene.add(comet);
  cometParticles.push(comet);
}

// === Camera Fly-through ===
let flyAngle = 0;
function updateCamera(){
  flyAngle += 0.002;
  camera.position.x = Math.sin(flyAngle)*900;
  camera.position.z = Math.cos(flyAngle)*900;
  camera.position.y = 150 + Math.sin(flyAngle*0.5)*80;
  camera.lookAt(0,0,0);
}

// === Animation Loop ===
function animate(){
  requestAnimationFrame(animate);

  galaxy.rotation.y += 0.0009;
  nebulaParticles.forEach(n=>n.rotation.z+=0.0002);

  cometParticles.forEach((c,i)=>{
    c.position.add(c.velocity);
    c.trail.push(c.position.clone());
    if(c.trail.length>30) c.trail.shift();

    for(let j=0;j<c.trail.length;j++){
      const p = c.trail[j];
      const alpha = j/c.trail.length;
      const trailGeom = new THREE.SphereGeometry(1.5,4,4);
      const trailMat = new THREE.MeshBasicMaterial({color:0xffcc00, transparent:true, opacity:alpha*0.6});
      const point = new THREE.Mesh(trailGeom,trailMat);
      point.position.copy(p);
      scene.add(point);
      setTimeout(()=>scene.remove(point),120);
    }

    if(c.position.y<-500){ scene.remove(c); cometParticles.splice(i,1); }
  });

  if(Math.random()<0.012) createComet();

  updateCamera();
  controls.update();
  renderer.render(scene,camera);
}

// Click to spawn stars/comets
window.addEventListener('click',(e)=>{
  const starGeom = new THREE.BufferGeometry();
  const pos = new Float32Array([ (Math.random()-0.5)*300, (Math.random()-0.5)*50, (Math.random()-0.5)*300 ]);
  starGeom.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const starMat = new THREE.PointsMaterial({
    size:3,
    color:0xffffff,
    map:starTexture,
    transparent:true,
    blending:THREE.AdditiveBlending
  });
  const star = new THREE.Points(starGeom,starMat);
  scene.add(star);
  if(Math.random()<0.6) createComet();
});

window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

animate();
