import VNOverlay from './apps/VNOverlay.js';
// eslint-disable-next-line no-unused-vars
import constants from './constants.js';
//import TextPlugin from "./greensock/dist/plugins/TextPlugin.min.js";

(() => { })();

Hooks.once('init', async () => {

});

let DEBUG = true;
let secondsPerWord = 1.0;
let animatedSecondsPerWord = 0.3;
let minimumTimeOnscreen = 5 * 1000;
let timeBetweenScrollingMs = 500;
let onscreen = [];
let queue = [];
let maxOnscreen = 4;
let commandKey = "!";

function log(message) {
    if (DEBUG) {
        console.log("VINO | " + message);
    }
}

function logObject(object) {
    if (DEBUG) {
        console.log(object);
    }
}

Hooks.once('canvasReady', async () => {
  ui.vinoOverlay = new VNOverlay();

   ui.vinoOverlay.render(true);

  $("#vino-overlay").fadeOut(0);
});

Hooks.on("createChatMessage", function(message) {
  logObject(message);

  let speakingActor = game.actors.get(message.data.speaker.actor);
  logObject(speakingActor);

  if (!speakingActor) return;

  if (onscreen.length <= maxOnscreen && !onscreen.includes(speakingActor.name)) {
    addSpeakingActor(speakingActor.name, getMood(message.data.content), removeCommands(message.data.content), speakingActor.img, message.data._id);
  }
  else {
    queue.push({name: speakingActor.name, mood: getMood(message.data.content), text: removeCommands(message.data.content), img: speakingActor.img, id: message.data._id});
  }
});

// Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
//   return false;
// });

function getMood(messageText) {
  if (messageText.startsWith(commandKey + "mad")) return "mad";
  if (messageText.startsWith(commandKey + "sad")) return "sad";
  if (messageText.startsWith(commandKey + "joy")) return "joy";
  if (messageText.startsWith(commandKey + "fear")) return "fear";

  return "";
}

function removeCommands(messageText) {
  return messageText.replace(commandKey + "mad", "").replace(commandKey + "sad", "").replace(commandKey + "joy", "").replace(commandKey + "fear", "").trim();
}

function wordCount(str) { 
  return str.split(" ").length;
}

function removeFromArray(array, element) {
  const index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
  }
}

function addSpeakingActor(actorName, mood, text, img, id)
{
  var previousLength = onscreen.length;
  onscreen.push(actorName);
  log("Appending " + actorName);

  let html = `<div id="${id}" class="vino-chat-frame" style="display:none;">`;
  html +=   `<img src="${img}" class="vino-chat-actor-portrait" />`;
  html +=   `<div class="vino-chat-flexy-boi">`;
  html +=   `  <div class="vino-chat-body">`
  html +=   `    <div class="vino-chat-actor-name">${actorName}</div>`;
  html +=   `    <div class="vino-chat-emotion-flare">${mood}</div>`;
  html +=   `    <div id="${id}-vino-chat-text-body" class="vino-chat-text-body">`;
  html +=   `      <p id="${id}-vino-chat-text-paragraph"></p>`;
  html +=   `    </div>`;
  html +=   `  </div>`;
  html +=   `</div>`;
  html +=   `</div>`;

  $("#vino-chat-lane")
    .append(html);

  if (previousLength == 0) {
    log("Showing vino overlay");
    $("#vino-overlay").fadeIn(500);
  }
  $("#" + id + ".vino-chat-frame").fadeIn(500);

  log("Appended " + actorName);


  TweenLite.to(`#${id}-vino-chat-text-paragraph`, wordCount(text) * animatedSecondsPerWord, { text: { value: `"${text}"`, delimiter:"" }, ease: Linear.easeIn });

  var scrollFn = setInterval(function(){
    console.log("Scrollin' ");
    TweenLite.to(`#${id}-vino-chat-text-body`, timeBetweenScrollingMs / 1000, { scrollTo: "max" });
  }, timeBetweenScrollingMs);
  
  var timeout = wordCount(text) * (1000 * secondsPerWord);
  if (timeout < minimumTimeOnscreen) {
    timeout = minimumTimeOnscreen;
  }

  setTimeout(function(){
    clearInterval(scrollFn);
    let frame = $("#" + id + ".vino-chat-frame");
    //TweenLite.to(`#${id}-vino-chat-text-paragraph`, 1, {text:{value:``, delimiter:""}, ease:Linear.easeNone});
    frame.fadeOut(1000, function() {
      frame.remove();
      removeFromArray(onscreen, actorName);
      handleQueue();
    });
  }, timeout);
}

function handleQueue() {
  logObject(queue);
  logObject(onscreen);
  if (queue.length == 0) {
    if (onscreen.length == 0) {
      log("Hiding overlay");
      $("#vino-overlay").fadeOut(1000);
    }
    return;
  };

  var data = queue.pop();
  addSpeakingActor(data.name, data.mood, data.text, data.img, data.id);
}
