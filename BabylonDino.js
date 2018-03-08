

var createScene = function() {
	var scene = new BABYLON.Scene(engine);
    var targetCam = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 3, 50, BABYLON.Vector3.Zero(), scene);
    //var targetCam = new BABYLON.TargetCamera("MainCamera", new BABYLON.Vector3(40,5,0), scene);
    targetCam.attachControl(canvas, true);

	BABYLON.SceneLoader.Append("https://www.babylonjs.com/Assets/ChibiRex/glTF/", "ChibiRex_Saturated.gltf", scene, function (scene) {
		scene.executeWhenReady(function () {
            // Game global config
            var wallSpeed = 0.01;
            var wallSpawnInterval = 1000.0; // in ms

            scene.collisionsEnabled = true;

            scene.activeCamera = targetCam;
            targetCam.setTarget(new BABYLON.Vector3(0,0,0));

            var chibi = scene.getMeshByName("__root__");

            chibi.enablePhysics = true;

            var ground = BABYLON.Mesh.CreateGround("Ground", 32,256,2, scene);
            var groundMat = new BABYLON.StandardMaterial("GroundMat", scene);
            groundMat.diffuseColor = new BABYLON.Color3(0.345, 0.494, 0.380);

            ground.material = groundMat;
            ground.position = BABYLON.Vector3.Zero();

            var chibiParent = BABYLON.Mesh.CreateSphere("ChibiParent", 3, 2, scene);

            chibi.parent = chibiParent;
            chibi.position.y = -1; // For the trex to be on the ground
            chibiParent.isVisible = false;
            chibiParent.rotation = new BABYLON.Quaternion(0,-5,0,0);
            chibiParent.position.y = 5;

            chibiParent.position.y = 5;

            scene.enablePhysics(new BABYLON.Vector3(0,-60,0));
            
            chibiParent.physicsImpostor = new BABYLON.PhysicsImpostor(chibiParent, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.1  }, scene);
            //chibiParent.ellipsoid = new BABYLON.Vector3(5.0,5.0,5.0);
            chibi.checkCollisions = true;
            
            chibi.ellipsoid = new BABYLON.Vector3(1, 1, 1);
            chibi.onCollide = function(){
                console.info("test");
                groundMat.diffuseColor = new BABYLON.Color3(1.0,0.0,0.0);
            };
            chibiParent.physicsImpostor.registerOnPhysicsCollide()

            ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);


            // Light
            var light = new BABYLON.DirectionalLight("SunLight", new BABYLON.Vector3(0, -1, -1), scene);
            light.position = new BABYLON.Vector3(1, 7, -2);
            light.intensity = 0.7;

            // Environnement
            var helper = scene.createDefaultEnvironment({
                cameraContrast: 1.5,
                cameraExposure: 1.66,
                toneMappingEnabled: true,
                groundShadowLevel: 0.8,
                groundOpacity: 0.0,
                skyboxColor: new BABYLON.Color3(.060, .0777, .082),
                groundColor: new BABYLON.Color3(.07, .087, .0893)
            });

            window.addEventListener("keydown", onKeyDown, false);
            function onKeyDown(event){ 
                switch (event.keyCode) {
                    case 32: // Space
                        if (!isJumping)  
                            chibiParent.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0,20,0));
                         break;    
                }
            }

            // Obstacles
            var movingWalls = [];
            var elapsedTimeWall = 0;
            var availableWalls = [];

            // Player
            var isJumping = false;
            var iWallIndex = 0;
            scene.registerBeforeRender(function() {
                var deltaTime = scene.getAnimationRatio() / (60.0 / 1000.0);

                elapsedTimeWall += deltaTime;
                if (elapsedTimeWall > wallSpawnInterval)
                {
                    elapsedTimeWall = 0;
                    var newWall = null;

                    if (availableWalls.length == 0)
                    {
                        newWall = new BABYLON.Mesh.CreateBox("Wall" + iWallIndex, 1, scene);
                        ++iWallIndex;
                        newWall.physicsImpostor = new BABYLON.PhysicsImpostor(newWall, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution:1 }, scene);
                        newWall.scaling.x = 32;
                        newWall.position.y = 0.5;
                        newWall.checkCollisions = true;
                    }
                    else
                        newWall = availableWalls.pop();
                    
                    newWall.position.z = 20;
                    movingWalls.push(newWall);
                    
                }
                for (var iWall = 0; iWall < movingWalls.length; ++iWall)
                {
                    var testCollider = movingWalls[iWall].moveWithCollisions(new BABYLON.Vector3(0,0,-wallSpeed * deltaTime));
                    //testCollider
                    if (movingWalls[iWall].position.z < -20)
                    {
                        availableWalls.push(movingWalls[iWall]);
                        movingWalls.splice(iWall, 1);
                        --iWall;
                    }
                }
                isJumping = chibiParent.position.y > 1.01;
                    
                if (chibiParent.collider != null)// && chibiParent.collider.collidedMesh.name.startsWith("Wall"))
                {
console.info(chibiParent.collider.collidedMesh.name);
                    groundMat.diffuseColor = new BABYLON.Color3(1.0,0.0,0.0);
                }
            });

            // We lock the rotation
            scene.registerAfterRender(function(){
                chibiParent.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
            });

		});
	});

	return scene;
};