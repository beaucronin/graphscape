var nodes = {};
var SPEED = 5;
var graph = new Graph(),
	// layout = new Layout.ForceDirected(graph, { layout: '3d', attraction: .5, repulsion: 0.01, width: 1000, height: 1000 });
	layout = new Layout.ForceDirected(graph, { layout: '3d', attraction: .1, repulsion: 0.01, width: 1000, height: 1000, iterations: 10000 });

var spriteMaterial = new THREE.SpriteMaterial( 
{ 
	map: (new THREE.TextureLoader()).load('glow.png'),
	color: 0x00ff0f, transparent: false, blending: THREE.AdditiveBlending
});

var vertexPool = [],
	POOL_SIZE = 10000;

var container, stats;
var camera, scene, renderer, points;
var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function createNode(name) {
	// var vertex = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - 1.5);
	// points.geometry.vertices.push(vertex);
	var vertex = vertexPool.pop();
	vertex.x = Math.random();
	vertex.y = Math.random();
	vertex.z = Math.random();
	points.geometry.verticesNeedUpdate = true;
	nodes[name] = vertex;
	var node = new Node(name);
	node.position = vertex;
	node.data = vertex;
	if (graph.addNode(node))
		layout.updateParams();
}

function processEvent(e) {
	if ('type' in e) {
		// if (e.type == 'PLAY' && ! layout.started)
			// layout.init();
			// setTimeout(function() { layout.init(); }, 5000);
		// informational message
		// console.log(e);
	} else {
		if (! (e.src in nodes))
			createNode(e.src);

		if (! (e.tgt in nodes))
			createNode(e.tgt);

		if (graph.addEdge(graph.getNode(e.src), graph.getNode(e.tgt)))
			layout.updateParams();

		if (layout.state == 'NEW') {
			layout.run();
			setTimeout(function() { layout.cool(); }, 10000)
		}


		var sprite = new THREE.Sprite( spriteMaterial.clone() );
		sprite.scale.set(0.25, 0.25, 0.25);

		var p1 = graph.getNode(e.src).position.clone(),
			p2 = graph.getNode(e.tgt).position.clone(),
			geo = new THREE.Geometry(),
			mat = new THREE.MeshLambertMaterial({ color: 0x2222ff }),
			mesh = new THREE.Mesh(geo, mat);

		mesh.add(sprite);
		scene.add(mesh);

		var tween = new TWEEN.Tween({ x: p1.x, y: p1.y, z: p1.z })
			.to({ x: p2.x, y: p2.y, z: p2.z }, 1000)
			.onStart(function() {
				mesh.position.set(p1.x, p1.y, p1.z);
			})
			.onUpdate(function() {
				mesh.position.x = this.x;
				mesh.position.y = this.y;
				mesh.position.z = this.z;
			})
			.onComplete(function() {
				scene.remove(mesh);
			})
			.easing(TWEEN.Easing.Quadratic.InOut)
			.start();

	// 	var tween = new TWEEN.Tween({ a: 0.0 })
	// 		.to({ a: 1.0 }, 1000)
	// 		.onStart(function() {
	// 			mesh.position.set(p1.x, p1.y, p1.z);
	// 		})
	// 		.onUpdate(function() {
	// 			var p = graph.getNode(e.tgt).position,
	// 				v = p.sub(p1),
	// 				d = p1.add(v.multiplyScalar(this.a));
	// 			mesh.position.set(d.x, d.y, d.z);
	// 		})
	// 		.onComplete(function() {
	// 			scene.remove(mesh);
	// 		})
	// 		.easing(TWEEN.Easing.Quadratic.InOut)
	// 		.start();
	}
}

window.onload = function() {
	var socket = new WebSocket('ws://127.0.0.1:8080/');
	socket.onmessage = function(event) {
		processEvent(JSON.parse(event.data));
		var data = JSON.parse(event.data);
	}
	socket.onopen = function() {
		socket.send(JSON.stringify({
			command: "play",
			start: "2016-01-01T00:00:00.000Z",
			end: "2016-01-01T00:00:30.000Z",
			// start: "2001-03-01T00:00:00.000Z",
			// end: "2001-03-03T00:00:00.000Z",
			loop: true,
			speed: 1
		}));
	}

	var gui = new dat.GUI({
    	height : 5 * 32 - 1
	});
	gui.add(layout, 'attraction_multiplier').min(0.0).max(1.0).step(.025).name('attraction');
	gui.add(layout, 'repulsion_multiplier').min(.001).max(.005).step(.0005).name('repulsion');
}

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, .01, 2000 );
	camera.position.z = 5;
	camera.lookAt(0, 0, 0);

	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

	// var light = new THREE.AmbientLight( 0x404040 );
	// scene.add(light);
	// pointsMaterial.color.setHSL( 1.0, 0.3, 0.7 );
	


	var pointsGeometry = new THREE.Geometry(),
		vertex;
	for (i = 0; i < POOL_SIZE; i++) {
		vertex = new THREE.Vector3(0, 0, -10000);
		vertexPool.push(vertex);
		pointsGeometry.vertices.push(vertex);
	}
	pointsGeometry.verticesNeedUpdate = true;
	var pointsMaterial = new THREE.PointsMaterial(
		{ 
			map: THREE.ImageUtils.loadTexture( "ball.png" ),
			color: 0xaaaaff, 
			transparent: false, 
			alphaTest: 0.5,
			size: 1,
			sizeAttenuation: true 
		}
	);
	points = new THREE.Points(pointsGeometry, pointsMaterial);
	createNode('foo');

	scene.add(points);

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );

	var controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate(time) {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	layout.generate();
	TWEEN.update(time);
	points.geometry.verticesNeedUpdate = true;

}

init();
animate();
