
//Finds HTML element Mic_Button and assigns it to the var micButton
const micButton = document.getElementById("Mic_Button");

//Finds the HTML element for the text box
const speechText = document.getElementById("text-box");

//isRecording is a var that stores whether its recording or not
//Let means that value will change
let isRecording = false;

//Watches to see if mic button got clicked
micButton.addEventListener("click", function(){
    //Once mic button gets clicked, we are going to output debug state,ent into developer console
    console.log("Mic button got clicked so gs")
    
    //Checks if mic is recording
    // === means strict equal signs
    if (isRecording === false){
        //Starts recording and recording state into true
        console.log("Mic on")
        recognition.start();
        isRecording = true;

        //Changes Mic Text to Recording
        micButton.textContent = "Recording"
    }
    else{
        //If its recording and user clicks, then stop recording
        console.log("Mic off")
        recognition.stop();
        isRecording = false;

        //Changes Mic Text to Recording
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


const trashButton = document.getElementById("Trash_Button");
//trashButton = name of obj
//addEventListener = method
//("click", function() = parameters--> parameters click,function which contain speechText.value = "";
trashButton.addEventListener("click", function() {
    speechText.value = "";
});   


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



//Script for webcam

//Finds Webcam Element
const webcam = document.getElementById("webcam");

//Asks for camera access
navigator.mediaDevices.getUserMedia({video: true})
    //Give the camera as a stream and put into <video> element
    .then(stream => {
        webcam.srcObject = stream;
        console.log("Camera Connected");
    })

    .catch(error => {
        console.error("Camera error:",error);
    });