GameModels = function (scene) {
	const _this = this;
	const parentDir = location.protocol + '//' + location.host + '/assets/models/';

	this.manager = null;

	this.spawnPlayer = function (position, rotation, frame, material) {
		const playerModel = this.manager.addMeshTask('duplicate model', '', parentDir, 'model.babylon');
		playerModel.onSuccess = function (task) {
			const meshes = task.loadedMeshes;
			const particleSystems = task.loadedParticleSystems;
			const skeletons = task.loadedSkeletons;

			for (let i = 0; i < meshes.length; i++) {
				meshes[i].position.addInPlaceFromFloats(position.x, position.y, position.z);
				meshes[i].rotation = rotation;
				meshes[i].rotate(BABYLON.Axis.X, -Math.PI / 2, BABYLON.Space.WORLD);
				meshes[i].rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.WORLD);
				meshes[i].scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
				//https://forum.babylonjs.com/t/load-mesh-without-adding-to-scene/606/15
				meshes[i].material = material;
				meshes[i].isPickable = false;

				const speed = 30;
				const animation = BABYLON.Animation.CreateAndStartAnimation(
					'fade', meshes[i], 'visibility', 30, speed, meshes[i].visibility, 0.0,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
				);

			}

			const skelly = skeletons[0];
			const idleAnim = scene.beginWeightedAnimation(skelly, frame, frame + 1, 1, false, 2);

		};
		this.manager.load();
	};

	function initLoader() {
		const parentDir = location.protocol + '//' + location.host + '/assets/models/';
		const assetsManager = new BABYLON.AssetsManager(scene);
		_this.manager = assetsManager;

		assetsManager.useDefaultLoadingScreen = false;
		BABYLON.OBJFileLoader.SKIP_MATERIALS = true;

		const playerModel = assetsManager.addMeshTask('playerTask', '', parentDir, 'model.babylon');

		//playerModel.onTaskErrorObservable.add(function(task) {
    //	console.log('task failed', task.errorObject.message, task.errorObject.exception);
		//});

		playerModel.onSuccess = function (task) {
			const meshes = task.loadedMeshes;
			const particleSystems = task.loadedParticleSystems;
			const skeletons = task.loadedSkeletons;

			for (let i = 0; i < meshes.length; i++) {
				meshes[i].position.addInPlaceFromFloats(0, 0, 0);
				meshes[i].rotate(BABYLON.Axis.X, -Math.PI / 2, BABYLON.Space.WORLD);
				meshes[i].rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.WORLD);
				meshes[i].scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
				meshes[i].isPickable = false;
				//meshes[i].visibility = 1;
			}

			const skelly = skeletons[0];

			//skeleton debug
			/*
			var skeletonViewer = new BABYLON.Debug.SkeletonViewer(skelly, meshes[1], scene);
			skeletonViewer.isEnabled = true; // Enable it
			skeletonViewer.color = BABYLON.Color3.Red(); // Change default color from white to red

			var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 10, scene);
			var materialSphere = new BABYLON.StandardMaterial("texture1", scene);
			materialSphere.diffuseColor = BABYLON.Color3.Red();
			sphere.material = materialSphere;

			sphere.attachToBone(skelly.bones[59], meshes[0]);
			*/

			const idleAnim = scene.beginWeightedAnimation(skelly, 1, 411, 0, true, 2);
			const walkAnim = scene.beginWeightedAnimation(skelly, 415, 481, 1, true, 2);
			const runAnim = scene.beginWeightedAnimation(skelly, 484, 516, 0, true, 2);

			function blendToWeightedAnim(anim) {
				const target = anim.target;
				const targetArray = scene.getAllAnimatablesByTarget(target);

				if (targetArray.some((x) => x.isBlending)) return;

				anim.isBlending = true;
				scene.onBeforeAnimationsObservable.clear();
				const otherArray = targetArray.filter((x) => x != anim && x.weight > 0);

				function onBlendFinish() {
					for (let i = 0; i < otherArray.length; i++) {
						//otherArray[i].syncWith(null);
						otherArray[i].weight = 0;
					}

					anim.weight = 1.0;
					anim.isBlending = false;
				}

				function onTick() {
					//checking if done
					if (otherArray.every(x => x.weight <= 0)) {
						onBlendFinish();
						scene.onBeforeAnimationsObservable.remove(tick);
						return;
					}

					//blending
					let total = 0;
					for (let i = 0; i < otherArray.length; i++) {
						otherArray[i].weight -= 0.05;
						total += otherArray[i].weight;
					}

					anim.weight = 1.0 - total;
				}

				let tick = scene.onBeforeAnimationsObservable.add(() => onTick());

			}

			let counter = 0;

			INPUTMANAGER.add('test1', () => {
				walkAnim.syncWith(null);
				//runAnim.syncWith(walkAnim);
        blendToWeightedAnim(walkAnim);
        //runAnim.syncWith(walkAnim);
      }, 1);

      INPUTMANAGER.add('test2', () => {
    		//runAnim.syncWith(null);
        walkAnim.syncWith(runAnim);
        blendToWeightedAnim(runAnim);
      }, 1);

			_this.addModel('player', meshes, []);
			console.log('added');
		};

		assetsManager.onFinish = function (tasks) {
			_this.isLoaded = true;
			_this.onLoaded();
		};

		assetsManager.load();

	};

	initLoader();

	this.isLoaded = false;

	this.onLoaded = function () {
		EVENTMANAGER.runEvent('onModelsReady', this.modelLibrary);
		console.log('realadded');
	};

	this.addModel = function (name, meshArray, animationArray) {
		let entry = {
			meshes: meshArray,
			animations: animationArray,
		};

		this.modelLibrary[name] = entry;
	};

	this.modelLibrary = {};

};

AssetModels = function (game) {
	const _this = this;
	const scene = game.scene;
	const camera = game.camera;
	const parentDir = location.protocol + '//' + location.host + '/assets/models/'; //just localhost

	//BABYLON.Animation.AllowMatricesInterpolation = true;
	//scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();

	//setting up the overlay scene
	const overlay = new BABYLON.UtilityLayerRenderer(scene);
	const light1U = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0),
		overlay.utilityLayerScene);
	const light2U = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 1, -1),
		overlay.utilityLayerScene);

	//scene asset manager;
	const sceneAssetManager = new BABYLON.AssetsManager(scene);
	sceneAssetManager.useDefaultLoadingScreen = false;
	BABYLON.OBJFileLoader.SKIP_MATERIALS = true;

	const dummy = sceneAssetManager.addMeshTask('dummytask', '',
		'https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/Playground/scenes/',
		'dummy2.babylon');

	dummy.onSuccess = function (task) {
		const mesh = task.loadedMeshes[0];
		mesh.position.addInPlaceFromFloats(-2, -4, -10);

		var scalingFactor = new BABYLON.Vector3(1, 1, 1);
		mesh.scaling = scalingFactor;

		const newMeshes = dummy.loadedMeshes;
		const particleSystems = dummy.loadedParticleSystems;
		const skeletons = dummy.loadedSkeletons;

		var skeleton = skeletons[0];

		var idleAnim = scene.beginWeightedAnimation(skeleton, 90, 118, 1.0, true, 0.5);

		mesh.isPickable = false;
	};

	const dummy2 = sceneAssetManager.addMeshTask('dummy2task', '', parentDir, 'model.babylon');

	dummy2.onSuccess = function (task) {
		const meshes = task.loadedMeshes; //task == dummy2
		const particleSystems = task.loadedParticleSystems;
		const skeletons = task.loadedSkeletons;

		for (let i = 0; i < meshes.length; i++) {
			meshes[i].position.addInPlaceFromFloats(0, -4, -10);
			meshes[i].rotate(BABYLON.Axis.X, -Math.PI / 2, BABYLON.Space.WORLD);
			meshes[i].scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
		}

		const skelly = skeletons[0];

		//scene.beginAnimation(skelly, 0, 411, true, 2);
		scene.beginAnimation(skelly, 415, 481, true, 2);
		//scene.beginAnimation(skelly, 484, 516, true, 2);

		//list of states
		//behavior for each state
		//transition for each state

		//state
		//what to do in each state
		//trigger for each state
		//if state, do..

	};

	sceneAssetManager.load();

	//setting up the loader
	const assetsManager = new BABYLON.AssetsManager(overlay.utilityLayerScene);
	assetsManager.useDefaultLoadingScreen = false;
	BABYLON.OBJFileLoader.SKIP_MATERIALS = true;

	const allAssets = {};
	const gun = assetsManager.addMeshTask('m4a4task', '', parentDir, 'gun.obj');

	gun.onSuccess = function (task) {
		const gunMesh = task.loadedMeshes[0];
		gunMesh.position.addInPlaceFromFloats(1.8, -2.8, 2.5);
		gunMesh.rotation.addInPlaceFromFloats(0, -3.2, 0);
		gunMesh.parent = camera;
		allAssets.gun = gunMesh;

	};

	assetsManager.onProgress = function (remainingCount, totalCount, lastFinishedTask) {
		//console.log(remainingCount + ' out of ' + totalCount + ' items still need to be loaded.');
	};

	assetsManager.onTaskErrorObservable.add(function (task) {
		console.log('task failed', task.errorObject.message, task.errorObject.exception);
	});

	assetsManager.onFinish = function (tasks) {
		EVENTMANAGER.runEvent('onAssetsLoaded');
	};

	assetsManager.load();

	//scene.beginDirectAnimation(gunMesh, [animationAimGun, animationAimGun2], 0, 30, false);
	//scene.beginDirectAnimation(gunMesh, [animationAimGun2], 0, 30, false);

	return allAssets;
};
