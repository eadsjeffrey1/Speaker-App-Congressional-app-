function saveVideo(videoBlob) {
    return new Promise(function(resolve, reject) {
        const request = indexedDB.open("PrePresentationDB", 1);

        request.onupgradeneeded = function() {
            request.result.createObjectStore("videos");
        };

        request.onsuccess = function() {
            const db = request.result;
            const transaction = db.transaction("videos", "readwrite");

            transaction.objectStore("videos").put(videoBlob, "recordedVideo");

            transaction.oncomplete = function() {
                db.close();
                resolve();
            };

            transaction.onerror = function() {
                db.close();
                reject(transaction.error);
            };
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}


//Makes function from bdy tracker accessible to other scrips thru wind which represents browsers globeal environment
window.calculateBody;

//Finds HTML element Mic_Button and assigns it to the var micButton
const micButton = document.getElementById("Mic_Button");

//Finds the HTML element for the text box
const speechText = document.getElementById("text-box");

//isRecording is a var that stores whether its recording or not
//Let means that value will change
let isRecording = false;

//Variables for Ai Audio Recording File
//mediaRecorder is the actual recorder
let mediaRecorder;
//The recording is giving in chunks, so we store it into an arrray
let audioChunks = [];

//capture of combined video and audio stream
let audio_cam_Recorder;

let webcamStream;

//holds the pieces of the video recording
let video_Chunks = [];

//Watches to see if mic button got clicked
//async: Mic acces takes a little time so async allows us to use await which waits until mic before moving on
micButton.addEventListener("click", async function(){
    //Once mic button gets clicked, we are going to output debug state,ent into developer console
    console.log("Mic button got clicked so gs")
    
    //Checks if mic is recording
    // === means strict equal signs
    if (isRecording === false){

        //The following is for the audio recording used for the ai

        //Var called recording holds mic connection, wait until browser give mic access Eads.J
        const recording = await navigator.mediaDevices.getUserMedia({
            //Gets Mic Access 
            audio: true
        });

        //webcamStream waits asks the browser for access to camera, and waits for camera request to finish
        webcamStream = await navigator.mediaDevices.getUserMedia({
           //Requests video from webcam
            video:true
        });

        document.getElementById("webcam").srcObject = webcamStream;
        console.log("Camera connected:", document.getElementById("webcam").srcObject);
        
        const video = webcamStream.getVideoTracks()[0];
        const audio = recording.getAudioTracks()[0];

        //makes a list containing the video and audio
        const inputs = [video, audio]

        //Combines the two into one "stream" (btw this is the live)
        const combinedStream = new MediaStream(inputs);
        
        //Creates a recorder that listens to the combineds stream
        audio_cam_Recorder = new MediaRecorder(combinedStream);
        //Begins to capture the combined video and audio stream
        audio_cam_Recorder.start();

        //when we get data from the recorder we put that piece into video_Chunks
        audio_cam_Recorder.ondataavailable = function(event){
            video_Chunks.push(event.data);
        };

        //Creates audio recorder ad tells it tor record from microphone stream
        mediaRecorder = new MediaRecorder(recording);

        //Empty list, because we dont want to keep old recordings
        audioChunks = [];

        //Tells recoder to start recording
        mediaRecorder.start();

        //Puts the chunks of audio into our array audioChunks
        mediaRecorder.ondataavailable = function(event){
            audioChunks.push(event.data)
        }


        //-----------------------------------------------------------------
        //Starts recording and recording state into true (Recording for TextBoxVisual)Eads.J
        console.log("Mic on")
        recognition.start();
        isRecording = true;



        //Changes Mic Text to Recording
        micButton.textContent = "Recording"
    }
    else{
        //If its recording and user clicks, then stop recording both audios
        console.log("Mic off")
        
       

        

        //Waits until recording finishes
        audio_cam_Recorder.onstop = async function(){
            //combimes saved pieces into blob
            const videoBlob = new Blob(video_Chunks,{ type:"video/webm"});
            await saveVideo(videoBlob);

            //Creates a Url where we can pla the vid
            const vidURL = URL.createObjectURL(videoBlob);
            console.log("Video URL: ", vidURL);

            //Lets results pg access saved url 
            localStorage.setItem("recordedVideo", vidURL);
            console.log("Saved video URL: ", localStorage.getItem("recordedVideo"));

            

            //gets teh cameras media tracks, 
            webcamStream.getTracks().forEach(function(track){
                //stops each trac
                track.stop();
            });
            //opens the url directly instead of making user press link
            //window.open(vidURL);

           //Saves the URL for the results page
           //localStorage.setItem("recordedVideo", vidURL);
    

            //outputs the video in console
            console.log("Video w/ audio ", videoBlob);
        };

        //Stops the recording(audio + cam)
        audio_cam_Recorder.stop();
        


        //Turns off recording for text visual Eads.J
        recognition.stop();
        
        //Turns off recording for the blob
        mediaRecorder.stop();

        //Gets results from bodyTracker
        const bodyResults = window.calculateBody();

        //Converts it into storable text and saves them so results html can access
        localStorage.setItem("movementResults", JSON.stringify(bodyResults));
        console.log(bodyResults);


        //Creats the blob
        //onstop: waits until recorder has finished stopping
        mediaRecorder.onstop = function(){
            //combines the audio chunks into one audio file-like obj
            //audiBlob is what is sent to Express Server (Blob = Binary Large Obj--> Holds raw data)
            const audioBlob = new Blob(audioChunks,{
                //Tells browswer what kind of data Blob contains
                type: "audio/webm"
            });
            //Shows the blob in the console (debug) Eads.J
            console.log(audioBlob);
            
            //Sends request to "server" at port 3000
            //localhost = your own computer, 3000 = port server ned to be listening on, /upload = route
            fetch("http://localhost:3000/upload",{
                //Sends data to server method=what kind of request we are giving
                method: "POST",
                //Sends actuall recording body=actual data
                body: audioBlob
            })
            //Respons = what the server sends back
            //Gets thes the serves respons and converts it to java script
            .then(response => response.json())
            //puts it into the data var
            .then(data =>{
                //sends the user to results after the video has been made
                window.location.href = "results.html";

                //Creates storage area in browser so results.html can access it
                localStorage.setItem("speechResults", JSON.stringify(data));
                console.log("New speech results saved: ", data);
                console.log("Filler Words:", data.filler_Words);
                console.log("Pauses:", data.pauses);
                //Outputs the data from server into console
                console.log("RESULTS FROM SERVER:", data);
                console.log("TRANSCRIPT:", data.transcript);
                console.log("WORD COUNT:", data.word_Count);
                console.log("TOTAL TIME:", data.total_Time);
                console.log("WPM:", data.wpm);
                console.log("FILLER COUNT:", data.filler_Count);
                console.log("FILLER WORDS:", data.filler_Words);
                console.log("PAUSES:", data.pauses);
                console.log(JSON.stringify(data.filler_Words, null, 2));
            })

        };
        
        
        //Changes it so mic isnt recording and the text is click record
        isRecording = false;
        micButton.textContent = "Click to Record"
    }
    

});

//Stores browsers speech recognition feature hear.
//window.SpeechRecognition || window.webkitSpeechRecognitionl; (Looks for a certain browser sppechj recog tool, if not there then look for a dif one)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

//Creates a new speechRecognition using the tool from var SpeechRecognition
//SpeechRecognition = tool
//recognition = new speech recognizer made
const recognition = new SpeechRecognition();

//Keeps recognition going without stopping
//Had prob where it would stop when it thinks u ended a setence
recognition.continuous = true;

//Tells browser to gives us results even when it is still figuring out what we are saying
//Can autocorrect
recognition.interimResults = true;

//creates var that remembers the final speech
let finalTranscript = "";

//When the broswer recognizes the speech we will output it to console
recognition.onresult = function(event){
    //results hjas multiple speech stuff, first [0] gets the first speech result and second [0] gets the first result of the possible interpretations
    //first [0] = first speech result  second[0] = first interpretation of that result
    //transcript gives the actuall words understood
    //Adds text in textbox, .vaslue changes text inside textbox
    //For ex: speechText.value += event.results[0][0].transcript;
    
    //Prints in console
    //console.log(event.results[0][0].transcript);
    //console.log(event.results.length);

    //Var for words Chrome is figuring out
    let interimTranscript = "";

    let transcript = "";

    //Loop goes thru each epeech result and adds it to the transcript
    //ResultIndex looks at the results from a certain postion. So it doesnt look at the reslts from a text that was previously said on the interim
    
    for (let i = event.resultIndex; i < event.results.length; i++){
        //Checks if the full speech is finished
        //isFinal is given by chrome
        if (event.results[i].isFinal){
            console.log("Final: ", (event.results[i][0].transcript));
            finalTranscript += event.results[i][0].transcript + " ";
        }
        else{
            interimTranscript += event.results[i][0].transcript;
        }
        
        //Prints out what we say in console
        //console.log(event.results[i][0].transcript);
        //Adds it to transcript
       // transcript += event.results[i][0].transcript + " ";
    }
    //Puts Speech into textbox
    //Shows everthign comfirmed + plus uncmfirmed
    speechText.value = finalTranscript + interimTranscript;

}

//Trash Button
const trashButton = document.getElementById("Trash_Button");
//trashButton = name of obj
//addEventListener = method
//("click", function() = parameters--> parameters click,function which contain speechText.value = "";
trashButton.addEventListener("click", function() {
    speechText.value = "";
});   

//Bullet Poitn List
document.addEventListener("DOMContentLoaded", function() { //Makes the JS run after the HTML in this situation

    const bulletList = document.getElementById("bullet-list");
    const addButton = document.getElementById("add-bullet");

    let bulletNumber = 1;

    addButton.addEventListener("click", function() {

        bulletNumber++;

        const newBullet = document.createElement("div");
        newBullet.classList.add("bullet-item");

        const number = document.createElement("span");
        number.textContent = bulletNumber + ".";

        const textarea = document.createElement("textarea");
        textarea.placeholder = "Type your sentence...";

        newBullet.appendChild(number);
        newBullet.appendChild(textarea);

        bulletList.appendChild(newBullet);
    });

});



