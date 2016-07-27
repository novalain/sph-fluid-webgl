/** 
A brute-forced incompressible 
fluid based on Smoothed Particles Hydrodynamics with 
Navier-Stokes equations 
*/

class SPHFluid {
  constructor() {
    // Physical attrs
    this.numParticles = 250;
    this.viscousity = 900 * 5;
    this.particleMass = 500 * .13;
    this.h = 16;
    this.stiffness = 400 * 5;
    this.gravityConst = 120000 * 9.82;
    this.dt = 0.0004;

    this.particles_ = [];
    this.particlePositions_ = [this.numParticles];
    this.fireParticles_ = false;
    
    this.initParticles();
  }

  get particles() { return this.particles_; }
  get particlePositions() { return this.particlePositions_; }

  fireParticles() {
    this.fireParticles_ = !this.fireParticles_;
  }

  initParticles() {
    // clear old particles
    /*for( var i = scene.children.length - 1 ; i > 0; i--){
      scene.remove(scene.children[i]);
    }*/
    this.particles_ = [];

    const geometry = new THREE.CircleGeometry(WaterEngine.PARTICLE_RADIUS, 16);
    const material = new THREE.MeshBasicMaterial({color: 0x2FA1D6});
    // Set starting positions
    let k = 0;
    let j = 0;

    for (let i = 0; i < this.numParticles; i++) {
      this.particles_.push({
        position: new THREE.Vector3(0, 0, 0),
        vel: new THREE.Vector3(0, 0, 0),
        pressure: 0,
        density: 0,
        viscousityForce: new THREE.Vector3(0, 0, 0),
        pressureForce: new THREE.Vector3(0, 0, 0),
        gravityForce: new THREE.Vector3(0, 0, 0),
        otherForce: new THREE.Vector3(0, 0, 0),
      });

      if (i % 40 === 0) {
        k++;
        j = 0;
      }
      j++;

      this.particles_[i].position.set(
          WaterEngine.START_OFFSET_X + j * this.h / 2, WaterEngine.START_OFFSET_Y + k * this.h / 2, 0);
      this.particlePositions_[i] = this.particles_[i].position;
    }
  }

  calculateDensityAndPressure() {
    for (let i = 0; i < this.particles_.length; i++) {
      let densitySum = 0;

      for (let neighborParticle of this.particles_) {
        let diffVec = new THREE.Vector3(0, 0, 0);
        diffVec.subVectors(this.particles_[i].position, neighborParticle.position);
        const absDiffVec = diffVec.length();

        if (absDiffVec < this.h) {
          densitySum += this.this.particles_[i]Mass *
              (315 / (64 * Math.PI * Math.pow(this.h, 9.0))) *
              Math.pow((Math.pow(this.h, 2.0) - Math.pow(absDiffVec, 2)), 3.0);
        }
      }

      this.particles_[i].density = densitySum;
      this.particles_[i].pressure = this.stiffness * (densitySum - 998);

      if (this.fireParticles_) {
        this.particles_[i].otherForce = new THREE.Vector3(0, 50000, 0);
      } else {
        this.particles_[i].otherForce = new THREE.Vector3(0, 0, 0);
      }
    }
  }

  calculateForces() {
    // TODO: compare speed with classic for loop and for..of
    for (let i = 0; i < this.numParticles; i++) {
      let gravity = new THREE.Vector3(
          0, -this.gravityConst * this.particles_[i].density, 0);
      let pressure = new THREE.Vector3(0, 0, 0);
      let viscousity = new THREE.Vector3(0, 0, 0);

      for (let j = 0; j < this.numParticles; j++) {
        if (i === j) {
          continue;
        }

        const diffVec = new THREE.Vector3(0, 0, 0);
        diffVec.subVectors(
            this.particles_[i].position, this.particles_[j].position);

        const absDiffVec = diffVec.length();
        if (absDiffVec < this.h) {
          let W_const_pressure = 45 / (Math.PI * Math.pow(this.h, 6.0)) *
              Math.pow(this.h - absDiffVec, 3.0) / absDiffVec;
          let W_pressure_gradient = new THREE.Vector3(
              W_const_pressure * diffVec.x, W_const_pressure * diffVec.y, 0);
          let visc_gradient =
              (45 / (Math.PI * Math.pow(this.h, 6.0))) * (this.h - absDiffVec);

          pressure.add(
              W_pressure_gradient.multiplyScalar(
                  -this.particleMass *
                  ((this.particles_[i].pressure + this.particles_[j].pressure) /
                   (2 * this.particles_[j].density))));

          let tempVel = new THREE.Vector3(0, 0, 0);
          tempVel.subVectors(this.particles_[j].vel, this.particles_[i].vel);

          viscousity.add(
              tempVel.divideScalar(this.particles_[j].density)
                  .multiplyScalar(
                      this.viscousity * this.particleMass * visc_gradient));
        }
      }

      this.particles_[i].viscousityForce.set(
          viscousity.x, viscousity.y, viscousity.z);
      this.particles_[i].pressureForce.set(pressure.x, pressure.y, pressure.z);
      this.particles_[i].gravityForce.set(gravity.x, gravity.y, gravity.z);
    }
  }

  // Brute force style
  calculateAcceleration() {
    this.calculateDensityAndPressure();
    this.calculateForces();
  }

  idle() {
    let newPos = new THREE.Vector3(0, 0, 0);
    let newVel = new THREE.Vector3(0, 0, 0);
    let newPositions = [];

    for (let i = 0; i < this.particles_[i].length; i++) {
      newPos.addVectors(this.particles_[i].gravityForce, this.particles_[i].viscousityForce);
      newPos.add(this.particles_[i].pressureForce);
      newPos.add(this.particles_[i].otherForce)
          newPos.multiplyScalar((this.dt * this.dt) / (2 * this.particles_[i].density));
      newPos.add(this.particles_[i].vel.multiplyScalar(this.dt));
      newPos.add(this.particles_[i].position);

      newVel.subVectors(newPos, this.particles_[i].position);
      newVel.multiplyScalar(1 / this.dt);

      this.particles_[i].position.set(newPos.x, newPos.y, newPos.z);
      this.particles_[i].vel.set(newVel.x, newVel.y, newVel.z);
      newPositions.push(this.particles_[i].position);
      this.checkBoundaries(this.particles_[i]);
    }
    this.particlePositions_ = newPositions;
  }

  checkBoundaries(particle) {
    if (particle.position.x < WaterEngine.PARTICLE_RADIUS + 1) {
      particle.vel.x = -0.8 * particle.vel.x;
      particle.position.x = WaterEngine.PARTICLE_RADIUS + 1;
    }

    else if (particle.position.x > WaterEngine.SQUARE_SIZE - WaterEngine.PARTICLE_RADIUS - 1) {
      particle.vel.x = -0.8 * particle.vel.x;
      particle.position.x = WaterEngine.SQUARE_SIZE - WaterEngine.PARTICLE_RADIUS - 1;
    }

    if (particle.position.y < WaterEngine.PARTICLE_RADIUS + 1) {
      particle.vel.y = -0.8 * particle.vel.y;
      particle.position.y = WaterEngine.PARTICLE_RADIUS + 1;

    } else if (
      particle.position.y > WaterEngine.SQUARE_SIZE - WaterEngine.PARTICLE_RADIUS - 1) {
      particle.vel.y = -0.8 * particle.vel.y;
      particle.position.y = WaterEngine.SQUARE_SIZE - WaterEngine.PARTICLE_RADIUS - 1;
    }
  }
}
