import React, { useEffect, useRef } from 'react';
import { Pause } from 'lucide-react';

const Pose = (window as any).Pose;
const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS;
const Camera = (window as any).Camera;
const drawConnectors = (window as any).drawConnectors;
const drawLandmarks = (window as any).drawLandmarks;

interface PoseOverlayProps {
    isPaused: boolean;
    onLandmarks: (landmarks: any[], dims: {width: number, height: number}) => void;
    onError: (error: string) => void;
}

export const PoseOverlay: React.FC<PoseOverlayProps> = ({ isPaused, onLandmarks, onError }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poseRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    // The camera loop is set up once, so it reads the latest pause state from a ref
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;

    useEffect(() => {
        let isMounted = true;

        const initCameraAndPose = async () => {
            if (!videoRef.current || !canvasRef.current) return;

            try {
                // Wait for permissions manually just to handle errors cleanly before Camera wrapper takes over
                await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (err) {
                console.error("Camera error", err);
                if (isMounted) onError("Failed to access camera. Please allow camera permissions.");
                return;
            }

            const pose = new Pose({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            pose.onResults((results: any) => {
                if (!isMounted) return;
                
                // Draw skeleton
                if (canvasRef.current && videoRef.current) {
                    const canvasCtx = canvasRef.current.getContext('2d');
                    if (canvasCtx) {
                        canvasCtx.save();
                        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        
                        // We only want to draw if we are not paused, but even if paused, 
                        // camera might have last frame.
                        if (results.poseLandmarks) {
                            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                                        { color: 'rgba(255, 255, 255, 0.85)', lineWidth: 3 });
                            drawLandmarks(canvasCtx, results.poseLandmarks,
                                        { color: '#FFFFFF', fillColor: '#00806E', lineWidth: 2, radius: 4 });
                            
                            // Send to parent
                            if (!isPausedRef.current) {
                                // Extract landmarks as JSON-serializable array
                                const landmarksData = results.poseLandmarks.map((lm: any) => ({
                                    x: lm.x,
                                    y: lm.y,
                                    z: lm.z,
                                    visibility: lm.visibility
                                }));
                                
                                onLandmarks(landmarksData, { 
                                    width: videoRef.current.videoWidth, 
                                    height: videoRef.current.videoHeight 
                                });
                            }
                        }
                        canvasCtx.restore();
                    }
                }
            });

            poseRef.current = pose;

            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (isMounted && !isPausedRef.current && videoRef.current && poseRef.current) {
                        try {
                            await poseRef.current.send({ image: videoRef.current });
                        } catch (e) {
                            // Ignored - usually happens during unmount or pause transitions
                        }
                    }
                },
                width: 640,
                height: 480
            });
            
            cameraRef.current = camera;
            camera.start().catch((err: any) => {
                console.error("Camera start error", err);
                if (isMounted) onError("Failed to start camera.");
            });
        };

        initCameraAndPose();

        return () => {
            isMounted = false;
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            if (poseRef.current) {
                poseRef.current.close();
            }
            // Ensure video tracks are fully stopped
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Empty dependency array, we handle isPaused inside loops

    // We can handle isPaused change by just relying on the check inside onFrame,
    // but the video itself can also be paused.
    useEffect(() => {
        if (videoRef.current) {
            if (isPaused) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(e => console.error(e));
            }
        }
    }, [isPaused]);

    return (
        <div className="lg:col-span-2 relative bg-black rounded-3xl overflow-hidden ring-1 ring-gray-900/10 flex items-center justify-center">
            <video 
                ref={videoRef} 
                playsInline 
                muted 
                className={`w-full h-full object-contain ${isPaused ? 'opacity-50' : ''}`}
                style={{ transform: 'scaleX(-1)' }} // Mirror video
            />
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                width={640}
                height={480}
                style={{ transform: 'scaleX(-1)' }} // Mirror canvas
            />
            
            {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/80 backdrop-blur px-8 py-4 rounded-full text-white font-semibold text-lg flex items-center">
                        <Pause className="w-6 h-6 mr-3 text-yellow-400" />
                        PAUSED
                    </div>
                </div>
            )}
        </div>
    );
};
