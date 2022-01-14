// let scene = new THREE.Scene();

// let camera = new THREE.PerspectiveCamera(35, window.innerWidth/window.innerHeight, 0.1, 1000);

// let renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.getElementById('out').appendChild(renderer.domElement);
// let shape = new THREE.Group();

// // var geometry = new THREE.BoxGeometry(2, 2, 2);
// // var material = new THREE.MeshBasicMaterial( {
// //     color: 0x0000ff
// // });
// // var cube = new THREE.Mesh(geometry, material);
// // scene.add(cube);

// const geometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
// const material = new THREE.MeshBasicMaterial( { 
//     color: 0xffff00,
//     transparent: true,
//     opacity: 1,
//     wireframe: true,
//     wireframeLinewidth: 5,
//     wireFrameLinejoin:'round',
//     wireframeLinecap:'round'
// } );
// const torusKnot = new THREE.Mesh( geometry, material );
// scene.add( torusKnot );

// camera.position.z = 100;
// function animate() {
//     requestAnimationFrame(animate);

//     torusKnot.rotation.x += 0.01;
//     torusKnot.rotation.y += 0.01;

//     renderer.render(scene, camera);
// }

// animate();


var noise = new SimplexNoise();
var vizInit = function () {
    var file = document.getElementById("thefile");
    var audio = document.getElementById("audio");
    var fileLabel = document.querySelector("label.file");

    document.onload = function(e) {
        console.log(e);
        audio.play();
        play();
    }
    file.onchange = function(e) {
        fileLabel.classList.add('normal');
        audio.classList.add('active');
        var files = this.files;

        audio.src = URL.createObjectURL(files[0]);
        audio.load();
        audio.play();
        play();
    }

    function play() {
        var context = new AudioContext();
        var src = context.createMediaElementSource(audio);
        var analyser = context.createAnalyser();
        src.connect(analyser);
        analyser.connect(context.destination);
        analyser.fftSize = 512;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
        var scene = new THREE.Scene();
        var group = new THREE.Group();
        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0,0,100);
        camera.lookAt(scene.position);
        scene.add(camera);

        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const geometry = new THREE.TorusKnotGeometry( 10, 3, 100, 16 );
        const material = new THREE.MeshBasicMaterial( { 
            color: 0x58172B,
            transparent: true,
            opacity: 1,
            wireframe: true,
            wireframeLinewidth: 5,
            wireFrameLinejoin:'round',
            wireframeLinecap:'round'
        } );
        var torusKnot = new THREE.Mesh( geometry, material );
        torusKnot.position.set(0,0,0);
        group.add( torusKnot );

        var ambientLight = new THREE.AmbientLight(0xaaaaaa);
        scene.add(ambientLight);

        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.intensity = 0.9;
        spotLight.position.set(-10, 40, 20);
        spotLight.lookAt(torusKnot);
        spotLight.castShadow = true;
        scene.add(spotLight);
        
        scene.add(group);

        document.getElementById('out').appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);

        render();

        function render() {
            analyser.getByteFrequencyData(dataArray);
      
            var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
            var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);
      
            var overallAvg = avg(dataArray);
            var lowerMax = max(lowerHalfArray);
            var lowerAvg = avg(lowerHalfArray);
            var upperMax = max(upperHalfArray);
            var upperAvg = avg(upperHalfArray);
      
            var lowerMaxFr = lowerMax / lowerHalfArray.length;
            var lowerAvgFr = lowerAvg / lowerHalfArray.length;
            var upperMaxFr = upperMax / upperHalfArray.length;
            var upperAvgFr = upperAvg / upperHalfArray.length;
      
            // makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
            // makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));
            
            makeRoughKnot(torusKnot, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
      
            group.rotation.y += 0.005;
            renderer.render(scene, camera);
            requestAnimationFrame(render);
          }

          function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function makeRoughKnot(mesh, bassFr, treFr) {
            mesh.geometry.vertices.forEach(function (vertex, i) {
                var offset = mesh.geometry.parameters.radius;
                var amp = 7;
                var time = window.performance.now();
                vertex.normalize();
                var rf = 0.00001;
                var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr;
                vertex.multiplyScalar(distance);
            });
            mesh.geometry.verticesNeedUpdate = true;
            mesh.geometry.normalsNeedUpdate = true;
            mesh.geometry.computeVertexNormals();
            mesh.geometry.computeFaceNormals();
        }
        audio.play();
         
    };
}

window.onload = vizInit();

document.body.addEventListener('touchend', function(ev) { context.resume(); });





function fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
}

function avg(arr){
    var total = arr.reduce(function(sum, b) { return sum + b; });
    return (total / arr.length);
}

function max(arr){
    return arr.reduce(function(a, b){ return Math.max(a, b); })
}