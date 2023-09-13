import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Pane } from 'tweakpane';
import { glbFiles } from './floorassets';
import { VertFloors } from './floorassets';
import { BoxGeometry } from "three";
import * as TWEEN from '@tweenjs/tween.js';
import { InteractionManager } from 'three.interactive';
import { createElement } from "react";


class ThreeDViewer {

    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private sizes: { width: number, height: number };
    private controls: OrbitControls;
    private floors: THREE.Mesh[] = [];
    private vertfloors: THREE.Mesh[] = [];
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private sphereIdDisplay: HTMLElement | null = null;

    constructor(canvasId: string) {

        /**
         * Initialize Scene
         */
        this.scene = new THREE.Scene();

        /**
         * 
         * Initialize Renderer
         */
        this.sphereIdDisplay = document.getElementById('sphereIdDisplay');
        let canvas = document.getElementById(canvasId);
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = canvasId;
        }

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };




        this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(2);
        this.renderer.setClearColor(0x000000, 0);
        document.body.appendChild(this.renderer.domElement);

        /**
         * Initialize Camera
         */
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);
        this.camera.layers.enable(0);
        this.camera.layers.enable(1);
        this.camera.layers.enable(2);
        /**
         * Add Orbit Controls
         */
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 15;
        this.controls.maxDistance = 35;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.04;

        /**
         * Lights
         */
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        this.scene.add(ambientLight);





        const pointLight = new THREE.PointLight(0xFFFFFF, 0.5);
        pointLight.position.set(2, 3, 4);
        this.scene.add(pointLight);

        const axesHelper = new THREE.AxesHelper(5);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        const compassElement = document.createElement("div");
        compassElement.id = "compass";
        compassElement.className = "compass";
        document.body.appendChild(compassElement);
        const grid = new THREE.GridHelper(200, 20, 0x000000, 0x000000);
        grid.material.opacity = 0.3;
        grid.material.transparent = true;


        const loadedModels: THREE.Object3D[] = [];
        const loader = new GLTFLoader();
        const loadModels = async () => {
            for (const fileName of glbFiles) {
                await new Promise<void>((resolve, reject) => {
                    loader.load(
                        fileName,
                        (gltf) => {
                            const model = gltf.scene;
                            model.position.set(0, 0, 0);

                            this.fitToView();
                            this.scene.add(model);
                            this.scene.add(grid);
                            resolve();
                        },
                        undefined,
                        (error) => {
                            console.error(`Error loading ${fileName}:`, error);
                            reject(error);
                        }
                    );
                });
            }
            console.log('All models have been loaded:', loadedModels);

        };
        loadModels();



        for (let i = 0; i < 20; i++) {
            const sphereGeometry = new THREE.BoxGeometry(6, 1, 6);
            const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 });
            const floor = new THREE.Mesh(sphereGeometry, sphereMaterial);

            floor.position.set(0, i * 1.25, 0);

            // unique ID to each sphere
            floor.userData = {
                id: i + 1,
                glbURL: VertFloors[i],
            };

            this.scene.add(floor);
            this.floors.push(floor);

        }


        for (let i = 0; i < 20; i++) {
            const sphereGeometry = new THREE.BoxGeometry(6, 3, 3);
            const sphereMaterial = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0 });
            const vertfloor = new THREE.Mesh(sphereGeometry, sphereMaterial);

            vertfloor.position.set(11.2, i * 1.3, 0);

            // unique ID to each sphere
            vertfloor.userData = {
                id: i + 1,
                glbURL: VertFloors[i],
            };

            this.scene.add(vertfloor);
            this.vertfloors.push(vertfloor);

        }


        this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));

        this.renderer.domElement.addEventListener('click', (event) => {
            const canvasRect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            const intersects = this.raycaster.intersectObjects(this.floors);


            if (intersects.length > 0) {
                const clickedObject = intersects[0].object as THREE.Group;
                const floorId = clickedObject.userData.id;


                if (floorId >= 1 && floorId <= 20) {
                    //  target and camera positions based on floorId
                    const targetPosition = new THREE.Vector3(0, floorId * 1.25, 0);
                    const cameraPosition = new THREE.Vector3(0, floorId * 1.25, 10);

                    // Trigger 
                    this.moveToNextScene(targetPosition, cameraPosition);
                }


            }
            const intersects2 = this.raycaster.intersectObjects(this.vertfloors);
            if (intersects2.length > 0) {
                const clickedObject = intersects2[0].object as THREE.Group;
                const vertfloors = clickedObject.userData.id;
                if (vertfloors >= 1 && vertfloors <= 20) {
                    //  target and camera positions based on floorId
                    const targetPosition = new THREE.Vector3(10, vertfloors * 1.25, 0);
                    const cameraPosition = new THREE.Vector3(10, vertfloors * 1.25, 10);

                    // Trigger 
                    this.moveToNextScene(targetPosition, cameraPosition);
                }
            }
        });












        window.addEventListener('resize', () => {
            this.resize();
        });

        this.animate();

        /**
         * For Debugging Purposes
         */
        this.addToGlobalVariables();

    }



    addToGlobalVariables(): void {

        //@ts-ignore
        window.THREE = THREE;

        //@ts-ignore
        window.scene = this.scene;

        //@ts-ignore
        window.camera = this.camera;

    }

    fitToView(): void {

        const bBox = new THREE.Box3();
        bBox.setFromObject(this.scene);

        const center = new THREE.Vector3();
        bBox.getCenter(center);

        const size = new THREE.Vector3();
        bBox.getSize(size);

        const directionVector = new THREE.Vector3(-5, -1, 5);

        const distance = bBox.min.distanceTo(bBox.max);

        this.controls.reset();
        this.controls.target.copy(center);

        this.camera.position.copy(center.clone().addScaledVector(directionVector.normalize(), distance));
        this.camera.lookAt(center);
        this.camera.updateProjectionMatrix();

    }


    private moveToNextScene(targetPosition: THREE.Vector3, cameraPosition: THREE.Vector3): void {
        // Define the new camera position and target
        const newPosition: THREE.Vector3 = cameraPosition;
        const newTarget: THREE.Vector3 = targetPosition;

        //  position and target
        const duration: number = 1000; // the duration (in milliseconds)

        const positionTween: TWEEN.Tween<THREE.Vector3> = new TWEEN.Tween(this.camera.position).to(newPosition, duration)
            .easing(TWEEN.Easing.Sinusoidal.Out);

        const targetTween: TWEEN.Tween<THREE.Vector3> = new TWEEN.Tween(this.controls.target).to(newTarget, duration)
            .easing(TWEEN.Easing.Sinusoidal.Out);

        positionTween.start();
        targetTween.start();
    }

    positionFloorLabel(label: HTMLDivElement, position: THREE.Vector3) {
        // Project 3D position to 2D screen coordinates
        const screenPosition = position.clone().project(this.camera);

        // Convert screen coordinates to pixel values
        const pixelX = (screenPosition.x + 1) * this.sizes.width / 2;
        const pixelY = (-screenPosition.y + 1) * this.sizes.height / 2;

        // Set the label's position using CSS
        label.style.position = 'absolute';
        label.style.left = pixelX + 'px';
        label.style.top = pixelY + 'px';
    }

    private onMouseClick(event: MouseEvent): void {
        const canvasRect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.floors);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object as THREE.Mesh;
            const sphereId = clickedObject.userData.id;

            (clickedObject.material as THREE.MeshPhongMaterial).color.setHex(0xffffff); // Red color


            if (this.sphereIdDisplay) {

                this.sphereIdDisplay.innerHTML = '';
                const fixedPosition = new THREE.Vector3(3, 0, 0);
                const glbURL = clickedObject.userData.glbURL;
                const loader = new GLTFLoader();

                loader.load(glbURL, (gltf) => {
                    const loadedObject = gltf.scene;
                    loadedObject.position.copy(fixedPosition);



                    this.scene.children.forEach((child) => {
                        if (child.name === 'loadedObject' && child.userData.id !== glbURL) {
                            this.scene.remove(child);
                        }
                    }); loadedObject.name = 'loadedObject';
                    this.scene.add(loadedObject);

                });


                // Add text content (floor ID) after the GLB object
                const textElement = document.createElement('span');
                textElement.textContent = `Floor ${sphereId} `;
                this.sphereIdDisplay.appendChild(textElement);
            }
        }
    }




    resize(): void {

        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;

        // Update camera
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(2);

    }
    updateCompass(): void {
        // Calculate the compass rotation based on the camera's rotation
        const cameraRotation = this.camera.rotation.y;

        const compassElement = document.getElementById("compass");

        if (compassElement) {
            // Calculate the rotation based on the camera's rotation
            let rotation = -cameraRotation;

            // Normalize the rotation to the range [0, 2π]
            if (rotation < 0) {
                rotation += Math.PI;
            }
            compassElement.style.transform = `rotate(${rotation}rad)`;
        }
    }


    animate(): void {

        this.controls.update();
        this.updateCompass();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate.bind(this));
        TWEEN.update();

    }
}

export { ThreeDViewer };
