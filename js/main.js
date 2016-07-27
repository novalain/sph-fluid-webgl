window.onload = function() {
  const fluid = new SPHFluid();
  const engine = new WaterEngine(fluid);
  engine.render();

  const gui = new dat.GUI();
  gui.add(fluid, 'viscousity', 4000, 5000);
  gui.add(fluid, 'stiffness', 1000, 3000);
  gui.add(fluid, 'particleMass', 50, 100);
  gui.add(fluid, 'h', 8, 22);
  gui.add(fluid, 'dt', 0.0001, 0.0008);

  /** TODO: implement change number of particles
  gui.add(fluid, 'numParticles', 1, 800).onChange(function(){
    fluid.initParticles();
    engine.initScene();
  });
  */
  document.addEventListener("mousedown", () => fluid.fireParticles());
  document.addEventListener("mouseup", () => fluid.fireParticles());
};

