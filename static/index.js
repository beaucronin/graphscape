var nodes = {};
var graph = new Graph(),
	layoutParams = {
		layout: '3d', 
		attraction: .1, 
		repulsion: 0.01, 
		width: 1000, 
		height: 1000, 
		iterations: 1000
	},
	layout = new Layout.ForceDirected(graph, layoutParams);

var playParams = {
	command: "play",
	// start: "2016-01-01T00:00:00.000Z",
	// end: "2016-01-01T00:00:30.000Z",
	start: "2001-03-01T00:00:00.000Z",
	end: "2001-03-08T00:00:00.000Z",
	loop: true,
	speed: 1
};

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
var socket;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function bumpLayout() {
	if (layout.state == 'COOL' || layout.state == 'DONE') {
		layout.bump();
	} else if (layout == 'RUN') {
		layout.updateParams();
	}
}

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
			layout.cool();
			// setTimeout(function() { layout.cool(); }, 10000)
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

	}
}

function startPlayback() {
	socket.send(JSON.stringify( playParams ) );
}

window.onload = function() {
	try {
		var host = window.document.location.host.replace(/:.*/, '')
		socket = new WebSocket('wss://' + host + ':5000');
	} catch (err) {
		console.log(err);
	}
	console.log(socket);
	socket.onmessage = function(event) {
		processEvent(JSON.parse(event.data));
		var data = JSON.parse(event.data);
	}
	socket.onopen = function() {
		startPlayback();
	}

	var gui = new dat.GUI({
    	height : 5 * 32 - 1
	});
	var f1 = gui.addFolder('Layout');
	f1.add(layout, 'attraction_multiplier', 0.0, 1.0, .025)
		.name('attraction')
		.onFinishChange(function() {
			bumpLayout();
		});
	f1.add(layout, 'repulsion_multiplier', .001, .005, .0005)
		.name('repulsion')
		.onFinishChange(function() {
			bumpLayout();
		});
	f1.add(layout, 'stop');
	var f2 = gui.addFolder('Playback');
	f2.add(playParams, 'loop').onFinishChange(function() { startPlayback(); });
	f2.add(playParams, 'speed', { '1x': 1, '2x': 2, '10x': 10, 'minute': 60, 'hour': 3600, 'day': 86400})
		.onFinishChange(function() { startPlayback(); });
}

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, .01, 2000 );
	camera.position.z = 10;
	camera.lookAt(0, 0, 0);

	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

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
	if (layout.state == 'RUN' || layout.state == 'COOL')
		layout.generate();
	TWEEN.update(time);
	points.geometry.verticesNeedUpdate = true;

}

init();
animate();
