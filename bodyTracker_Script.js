import { PoseLandmarker,FilesetResolver} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
//stores and finds the supporting WASM files MediaPipe needs
const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");

//PoseLandmarker = media pipe tool
//createFromOptios = w/ settings make detector
//vision is the files
//Note this is the "template code from https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js"
const poseLandmarker = await PoseLandmarker.createFromOptions(
    vision,
    {
        baseOptions: {
            //goolgles pretrained free lite model
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
        },
        //Option(runningMode)
        //Two Modes. Im using "VIDEO" which decodes frams of a vid or a livstream of input data
        runningMode: "VIDEO",
        
        //numPoses sets the max # of ppl that can be detected
        numPoses: 1
    });


//Creates variables for landmark cordinate origins
let noseX_origin;
let noseY_origin;

let leftShoulderX_origin;
let leftShoulderY_origin;

let rightShoulderX_origin
let rightShoulderY_origin

//Creates variables for movement over a second
let lastSecond = 0;          
let head_movement = 0;
let totalShoulder = 0;
let frameCount = 0;


//finds webcam element
const video = document.getElementById("webcam");

//Debug Statements
console.log("Video/bodytracker js: ", video)
//console.log("Camera stream:", video.srcObject);
//console.log("Video ready:", video.readyState);

//Listens for when video starts and then runs the coe when it does
video.addEventListener("loadeddata", function(){
    console.log("Webcam is ready for Media Pipe")

    //Looks at current fram from video
    function detect_body(){
        //identify positions of landmark
        const results = poseLandmarker.detectForVideo(
            //webcam video elemet
            video,
            //gives timestamp im ms
            performance.now()
        );

        //Checks to see that someone is in fram. 
        //If there is no one in frame, there are no landmarks

        if (results.landmarks.length > 0){
           //Note in media pipe: body parts have dif #s assigneed to them

            //gets the first detected persons landmarks
            const landmarks = results.landmarks[0];
            
            //gets the nose landmark nose = 0
            const nose = landmarks[0];
            //gets the left_shoulder landmark left_shoulder = 1
            const left_shoulder = landmarks[11];
             //gets the right_shoulder landmark right_shoulder = 1
            const right_shoulder = landmarks[12]
            
            //Checks to c if starting/origin cords were made
            if (noseX_origin === undefined){
                //Creates origin cords for nose and shoulders
                noseX_origin = nose.x;
                noseY_origin = nose.y;

                leftShoulderX_origin = left_shoulder.x;
                leftShoulderY_origin = left_shoulder.y;

                rightShoulderX_origin = right_shoulder.x;
                rightShoulderY_origin = right_shoulder.y;

                let trackStartTime = performance.now();
                console.log("Recorded starting cords");
            }



            //Calculates head movement by seing how far the nose has moved from origin
            const headX_movement = Math.abs(nose.x- noseX_origin);
            const headY_movement = Math.abs(nose.y- noseY_origin);
            head_movement += Math.sqrt((headX_movement**2) + (headY_movement**2));
            //console.log("Head movements: ",headX_movement , headY_movement);

            //Calculats left shoulder movement
            const leftShoulderX = Math.abs(left_shoulder.x - leftShoulderX_origin);
            const leftShoulderY = Math.abs(left_shoulder.y - leftShoulderY_origin);
            let left_shoulder_movement = Math.sqrt((leftShoulderX**2)  + (leftShoulderY**2));
            //console.log("Left shoulder movements: ", leftShoulderX, leftShoulderY);
           
            //Calculates Right Shoulder movement
            const rightShoulderX = Math.abs(right_shoulder.x  - rightShoulderX_origin);
            const rightShoulderY = Math.abs(right_shoulder.y  - rightShoulderY_origin);
            let right_shoulder_movement = Math.sqrt((rightShoulderX**2) + (rightShoulderY**2));
            //console.log("Right shoulder movements: ", rightShoulderX, rightShoulderY);

            //Calculates Total Shoulder movement
            totalShoulder += (right_shoulder_movement + left_shoulder_movement) / 2

            //Reports total movement for each
            //console.log("Total Movements Head/Shoulder: ", head_movement, totalShoulder);
            
            //Increases Frame Count by 1
            frameCount += 1;

            //Debug statement/gives all the landmarks in console
            // console.log("Nose:", nose.x, nose.y);
            //console.log("Left shoulder: ", left_shoulder.x, left_shoulder.y);
            //console.log("Right shoulder: ", right_shoulder.x, right_shoulder.y)
            
            //console.log("Body landmarks:", results.landmarks[0]); 
            
        }

        //tells us to rerun detect_body again before screen changes, basically loops it
        requestAnimationFrame(detect_body);
    }
    //Runs detect_body funct
    detect_body();
});



function calculateBody(){
    //Gets Avg Movements
    const avgHead = head_movement / frameCount
    const avgShoulder = totalShoulder / frameCount

    console.log("Avg Head: ", avgHead);
    console.log("Avg Shoulder: ", avgShoulder);
    console.log("FrameCount ", frameCount);
    console.log("Head movmenet: ", head_movement);

    //Categorizes the head movements into 3 thresholds
    let categorized_Head = null;

    //Media pipe cords are normalized between 0 and 1 percent so we are going to classify it in 3rds
    if (avgHead < 0.025){
        categorized_Head = "Low";
    }
    else if (avgHead  < 0.075){
        categorized_Head = "Middle";
    }
    else{
        categorized_Head = "High";
    }

    //Categorizes the shoulder movements into 3 thresholds
    let categorized_Shoulder = null;
            
    if (avgShoulder < 0.025){
        categorized_Shoulder = "Low";
    }
    else if (avgShoulder < 0.075){
        categorized_Shoulder = "Middle";
    }
    else{
        categorized_Shoulder = "High";
    }

    console.log("Catergorize", categorized_Head, categorized_Shoulder);
    return {
        headData: categorized_Head, 
        shoulderData: categorized_Shoulder
    };
}

//lets micScrtipt see funct
window.calculateBody = calculateBody;