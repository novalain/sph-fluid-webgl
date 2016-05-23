(function() {

// Constants
var NUM_PARTICLES = 300;

var VISCOUSITY = 400*5;
var PARTICLE_MASS = 500*.13;
var h = 16;
var STIFFNESS = 400*5;
var GRAVITY_CONST = 80000*9.82;

var scene, camera, renderer;
var particles = [];

initThreeJS();
animate();

function initThreeJS() {

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 1000;

    camera.position.set(256,256,600);

    initParticles();
    drawGrid();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x292929, 1);

    // Resizing window
    THREEx.WindowResize(renderer, camera);

    document.body.appendChild( renderer.domElement );

}

function initParticles(){

    var geometry = new THREE.CircleGeometry( 5, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0x3fd0ff} );
    var sphere = new THREE.Mesh( geometry, material );

    for(var i = 0; i < NUM_PARTICLES; i++){

        particles.push({mesh: new THREE.Mesh(geometry, material),
                        vel: new THREE.Vector3(0, 0, 0),
                        radius: 8,
                        pressure: 0,
                        density: 0,
                        viscousityForce: new THREE.Vector3(0, 0, 0),
                        pressureForce: new THREE.Vector3(0, 0, 0),
                        gravityForce: new THREE.Vector3(0, 0, 0),
                        otherForce: new THREE.Vector3(0, 0, 0)});

        scene.add(particles[i].mesh);

    }

    // Set positions
    var k = 0, j = 0;

    for(var i = 0; i < NUM_PARTICLES; i++){

        //Y-led
        if(i % 40 === 0){
            k++;
        }

        //X
        if(i % 40 === 0){
            j=0;
        }

        j++;

        particles[i].mesh.position.set(20+j*h/2 - 8, 19*16 + k*h/2 - 8, 0);

    }

}

function calculateDensityAndPressure(){

    for(var i = 0; i < NUM_PARTICLES; i++){

        var densitySum = 0;

        for(var j = 0; j < NUM_PARTICLES; j++){

            var diffVec = new THREE.Vector3(0,0,0);
            diffVec.subVectors(particles[i].mesh.position, particles[j].mesh.position);

            var absDiffVec = diffVec.length();

            //console.log("ABS DIFFVEC", absDiffVec);

            if(absDiffVec < h){

                densitySum += PARTICLE_MASS * (315 / (64*Math.PI * Math.pow(h, 9.0))) * Math.pow((Math.pow(h, 2.0) - Math.pow(absDiffVec, 2)),3.0);
                //cout << "Density: " << PARTICLE_MASS * (315 / (64 * M_PI * glm::pow(h, 9.0))) * glm::pow((glm::pow(h, 2.0) - glm::pow(abs_diffvec, 2.f)), 3.0) << endl;


            }

        }

        //console.log('pressure', particles[i].pressure);

        particles[i].density = densitySum;
        particles[i].pressure = STIFFNESS*(densitySum - 998);
        //particles[i].applyOtherForce(glm::vec3(0, 0, 0));

    }

}


function calculateForces(){

    for(var i = 0; i < NUM_PARTICLES; i++){

        var gravity = new THREE.Vector3(0, -GRAVITY_CONST*particles[i].density, 0);
        var pressure = new THREE.Vector3(0, 0, 0);
        var viscousity = new THREE.Vector3(0, 0, 0);

        for(var j = 0; j < NUM_PARTICLES; j++){

            if(i === j){
                continue;
            }

            var diffVec = new THREE.Vector3(0,0,0);
            diffVec.subVectors(particles[i].mesh.position, particles[j].mesh.position);

            var absDiffVec = diffVec.length();

          //  console.log('abs', absDiffVec);

            if(absDiffVec < h){

                var W_const_pressure = 45/(Math.PI * Math.pow(h, 6.0)) * Math.pow(h - absDiffVec, 3.0) / absDiffVec;

                var W_pressure_gradient = new THREE.Vector3(W_const_pressure * diffVec.x, W_const_pressure * diffVec.y, 0);

                var visc_gradient = (45/(Math.PI * Math.pow(h, 6.0)))*(h - absDiffVec);

                pressure.add(W_pressure_gradient.multiplyScalar(-PARTICLE_MASS * ((particles[i].pressure + particles[j].pressure) / (2 * particles[j].density))));

                var tempVel = new THREE.Vector3(0, 0, 0);
                tempVel.subVectors(particles[j].vel, particles[i].vel);

                viscousity.add(tempVel.divideScalar(particles[j].density).multiplyScalar(VISCOUSITY * PARTICLE_MASS * visc_gradient));




            }

        }

        particles[i].viscousityForce.set(viscousity.x, viscousity.y, viscousity.z);
        particles[i].pressureForce.set(pressure.x, pressure.y, pressure.z);
        particles[i].gravityForce.set(gravity.x, gravity.y, gravity.z);



    }

}

// Brute force style

function calculateAcceleration(){


    calculateDensityAndPressure();
    calculateForces();

}


function animate() {

    requestAnimationFrame( animate );

    calculateAcceleration();
    //handleInputs();
  //  display();
    idle();

    renderer.render( scene, camera );

}

function idle(){


    var dt = 0.0004;

    var newPos = new THREE.Vector3(0, 0, 0);
    var newVel = new THREE.Vector3(0, 0, 0);

    for(var i = 0; i < NUM_PARTICLES; i++){


        newPos.addVectors(particles[i].gravityForce, particles[i].viscousityForce);
        newPos.add(particles[i].pressureForce);
        newPos.multiplyScalar(dt*dt/(2*particles[i].density));
        newPos.add(particles[i].vel.multiplyScalar(dt));
        newPos.add(particles[i].mesh.position);

      //  if(i == 10)
        //  console.log('pos', newPos);

        newVel.subVectors(newPos, particles[i].mesh.position);
        newVel.multiplyScalar(1/dt);

        particles[i].mesh.position.set(newPos.x, newPos.y, newPos.z);
        particles[i].vel.set(newVel.x, newVel.y, newVel.z);

        //Boundaries
        checkBoundaries(i);
    }

}

function checkBoundaries(i){

    if(particles[i].mesh.position.x < 1){

        particles[i].vel.x = -0.8*particles[i].vel.x;
        particles[i].mesh.position.x = 1;
    }

    else if(particles[i].mesh.position.x > 511){

        particles[i].vel.x = -0.8*particles[i].vel.x;
        particles[i].mesh.position.x = 511;
    }

    if(particles[i].mesh.position.y < 1){

        particles[i].vel.y = -0.8*particles[i].vel.y;
        particles[i].mesh.position.y = 1;

    }


    else if(particles[i].mesh.position.y > 511){

        particles[i].vel.y = -0.8*particles[i].vel.y;
        particles[i].mesh.position.y = 511;

    }

}


function drawGrid(){

  var geometry = new THREE.Geometry();

  var material = new THREE.LineBasicMaterial({
        color: 0xffffff
  });

  geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  geometry.vertices.push(new THREE.Vector3(0, 512, 0));

  geometry.vertices.push(new THREE.Vector3(0, 512, 0));
  geometry.vertices.push(new THREE.Vector3(512, 512, 0));

  geometry.vertices.push(new THREE.Vector3(512, 512, 0));
  geometry.vertices.push(new THREE.Vector3(512, 0, 0));

  geometry.vertices.push(new THREE.Vector3(512, 0, 0));
  geometry.vertices.push(new THREE.Vector3(0, 0, 0));

  var line = new THREE.Line(geometry, material);

  scene.add(line);

}





})();
