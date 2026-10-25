//DeepGram Stuff

//dotenv reads env file and makes the key advailable to Node.jscode through
require("dotenv").config();

//stores key from .env and stores it in var
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

//takes createClient function out of DeepgramPackage
const { DeepgramClient } = require("@deepgram/sdk")

//Creates Deepgram client (conenct/interface to Deepgram)
const deepgram = new DeepgramClient({
    apiKey: deepgramApiKey
});


//-----------------------------------------------------------
//add Express so it can be used in the file
//Express = java script framework
const express = require("express");

//Create actual server application using express
//Server application = a program thatwaits for other porgrams to send request and then responds to thenm
//Var is named server
const server = express();

server.use((req,res, next) =>{
    //Tells browser that equests from other origins are allowed
    //* means any origin is allowed
    res.setHeader("Access-Control-Allow-Origin", "*");

    //Allows website to send content-type header which basically tells the server what kind of data im sending
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    //Next tells Express to continue to /puload route
    next();
});


// Debug
server.use((req, res, next) => {
    console.log("REQUEST RECEIVED:", req.method, req.url);
    next();
});


//If Webm audio is recieved, give raw audio datia instead of trying to interpret it
server.use(express.raw({ type: "audio/webm", limit: "10mb"}));


//server.post = When a post request is sent, it handles it here. "/upload" = route
// req = request (what browser sent us) 
// res = response (what our sever can send back)
server.post("/upload", async (req, res) =>{
    console.log("UPLOAD ROUTE REACHED");
    //res.send("TEST WORKED");
    const result = await deepgram.listen.v1.media.transcribeFile(
        //req.body = audio buffer
       req.body,
        {
            //Which deepgram speech model to use
            model: "nova-2",
            //Formats transcrip naturally
            smart_format: true,
            //Adds punctuation
            punctuate:true,
            //Identify filler words
            filler_words: true
        }

    );
    
    
    //Blank because we havent told server what t do yet
    //req.body = actual data inside that request
    //Outputs what deepgram gives backa fter transcription
    //console.log(result);

    //jSON.... expands nested objects so we can see transcript, fillerwords, etc
    console.log(JSON.stringify(result,null,2));


    //--------------------------------------------------------------------------------------------------------------------
    //SPEECH ANALYSIS

    //Extracts just the transcript
    //Note Deepgrams response is nestedd result--results-->channels[0]--> alternatives[0]---> transcript
    const transcript = result.results.channels[0].alternatives[0].transcript;
    console.log("TRANSCRIPT:", transcript);

    //Take the list of individual words and store it in a var
    const words = result.results.channels[0].alternatives[0].words;
    
    //Gets the word count of the whole speech
    const wordCount = words.length;
    console.log("WORD COUNT:", wordCount);

    //Gets speaking time
    const firstWord = words[0];
    const lastWord = words[words.length-1];

    //Gets when the last word ends and first word starts and subtracts the time
    //For ex: 5.36 - 1.68 = 3.68 sec
    const totalTime = lastWord.end - firstWord.start;
    console.log("Total Time:", totalTime);

    //Gets Wpm
    const wpm = wordCount / (totalTime/60);
    console.log("Wpm: ", wpm);
    
    //Gets the filler words
    const fillerWords = [];

    //Loops thru the words(lowercase) and checks if they are filler words
    for (let i = 0; i < words.length; i++){
        //.word gets the word property from ai thing
        let currentWord = words[i].word.toLowerCase();

        if (currentWord === "um" || currentWord === "uh" || currentWord === "like"){
            fillerWords.push(words[i]);
        }
    }
    console.log("FILLER WORDS: ", fillerWords);

    const fillerCount = fillerWords.length;
    console.log('FillerCount', fillerCount );


    //Detect pauses
    let pauses = [];
    
    //Goes thru the words
    for (let i = 0; i < words.length - 1; i ++){
        //Subtracts the start of the 2nd word and end of the first word to get how long the pause was
        let pause = words[i+1].start - words[i].end;

        //Checks if the pause was greater or = to one sec
        if (pause >= 1.5){
            //Adds the duration of the pause, the word that came before it and the word that came after it
            pauses.push({duration: pause, afterWord: words[i].word, beforeWord: words[i+1].word});
        }
    }
    console.log("pauses: ", pauses);

    /*
    //Sends msg back to the browser
    //res.send("Audiio recieved")
    //res.json sends javascript data back to micscript.js
    res.json({
        transcript: transcript
    })
    */

    //Sends all of the data back to front end
    res.json({
        transcript: transcript,
        word_Count: wordCount,
        total_Time: totalTime,
        wpm: wpm,
        filler_Count: fillerCount,
        filler_Words: fillerWords,
        pauses: pauses
    });
});

//Debig
server.get("/TEST123", (req, res) => {
    res.send("THIS IS MY SERVER.JS");
});



//Tells Server which port to listen to. Eads.J
//server.listen(3000,  start server and listen for requests coming to port 3000
//() =>{  console.log("Server is runnig on port 3000") = a function that runs once the server starts and display it in console
//Note: => is the arrow functio syntax in JavaScript
server.listen(3000, () =>{
    console.log("Server is runnig on port 3000")
});