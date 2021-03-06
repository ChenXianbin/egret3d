namespace egret3d {

    /**
     * Camera系统
     */
    export class CameraSystem extends paper.BaseSystem<Camera> {
        /**
         * @inheritDoc
         */
        protected readonly _interests = [
            { componentClass: Camera }
        ];

        private _applyDrawCall(context: RenderContext, draw: DrawCall): void {
            context.updateModel(draw.transform);

            let drawType: string = "base";

            if (draw.boneData) {
                context.updateBones(draw.boneData);
                drawType = "skin";
            }

            if (draw.lightMapIndex >= 0) {
                if (draw.gameObject.scene.lightmaps.length > draw.lightMapIndex) { // TODO scene 不应从 gameObject 获取。
                    context.updateLightmap(
                        draw.gameObject.scene.lightmaps[draw.lightMapIndex],
                        draw.mesh.glTFMesh.primitives[draw.subMeshInfo].attributes.TEXCOORD_1 ? 1 : 0,
                        draw.lightMapScaleOffset as any
                    );
                    drawType = "lightmap";
                }
            }

            const renderer = draw.gameObject.getComponent(MeshRenderer);
            if (renderer && renderer.receiveShadows) {
                context.receiveShadow = true;
            }
            else {
                context.receiveShadow = false;
            }

            WebGLKit.draw(context, draw.material, draw.mesh, draw.subMeshInfo, drawType, draw.transform._worldMatrixDeterminant < 0);
        }

        public $renderCamera(camera: Camera) {
            DrawCallList.updateZdist(camera);
            DrawCallList.sort();

            for (const drawCall of Pool.drawCall.instances) {
                // 视锥剔除
                // if(drawCall.frustumTest) {
                //     if(!camera.testFrustumCulling(drawCall.gameObject.transform)) {
                //         return;
                //     }
                // }

                if (camera.cullingMask & drawCall.gameObject.layer) {
                    if (drawCall.gameObject.activeInHierarchy) {
                        this._applyDrawCall(camera.context, drawCall);
                    }
                }
            }
            // Egret2D渲染不加入DrawCallList的排序
            const egret2DRenderSystem = paper.Application.systemManager.getSystem(Egret2DRendererSystem);
            if (egret2DRenderSystem && egret2DRenderSystem.enable) {
                for (const egret2DRenderer of egret2DRenderSystem.components) {
                    if (camera.cullingMask & egret2DRenderer.gameObject.layer) {
                        egret2DRenderer.render(camera.context, camera);
                    }
                }
            }
        }
        /**
         * @inheritDoc
         */
        public update() {
            this._components.sort((a, b) => {
                return a.order - b.order;
            });

            const lightSystem = paper.Application.systemManager.getSystem(LightSystem);
            const lights = lightSystem ? lightSystem.components : null;

            for (const component of this._components) {
                component.update(paper.Time.deltaTime);

                if (lights && lights.length > 0) {
                    component.context.updateLights(lights); // TODO 性能优化
                }
            }

            Performance.startCounter("render");

            if (this._components.length > 0) {
                for (const component of this._components) {

                    if (component.postQueues.length === 0) {
                        component.context.drawtype = "";
                        component._targetAndViewport(component.renderTarget, false);
                        this.$renderCamera(component);
                    }
                    else {
                        for (const item of component.postQueues) {
                            item.render(component, this);
                        }
                    }
                }
            }
            else {
                WebGLKit.webgl.clearColor(0, 0, 0, 1);
                WebGLKit.webgl.clearDepth(1.0);
                WebGLKit.webgl.clear(WebGLKit.webgl.COLOR_BUFFER_BIT | WebGLKit.webgl.DEPTH_BUFFER_BIT);
            }

            Performance.endCounter("render");
            Performance.updateFPS();
        }
    }
}
