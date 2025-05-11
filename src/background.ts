// import { v6 as randomUUIDv7 } from "uuid";
import { Keypair } from "@solana/web3.js";
// import nacl from "tweetnacl";
// import nacl_util from "tweetnacl-util";

// const CALLBACKS: { [callbackId: string]: (data: any) => void } = {};

let isRunning = false;

async function ensureOffscreenAndSendKeys(walletKey: string, secretKey: number[]) {
  const isOpen = await chrome.offscreen.hasDocument();
  if (!isOpen) {
    await chrome.offscreen.createDocument({
      url: '../public/offscreen.html',
      reasons: ['BLOBS'],
      justification: 'Persistent WebSocket for uptime validation'
    });

    // Wait a tiny bit for the offscreen script to load and register listeners
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // NOW it's safe to send the message
  chrome.runtime.sendMessage({
    type: 'INIT_KEYS',
    target: 'offscreen',
    walletKey,
    secretKey
  });
}

chrome.runtime.onInstalled.addListener(() => {
  const genKeypair = Keypair.generate();
  // const decoder = new TextDecoder();
  // const string = decoder.decode(genKeypair.secretKey)
  const regularArray = Array.from(genKeypair.secretKey);
  // console.log(string);
  chrome.storage.local.set({ secretKey: regularArray, isConnected: false }, function () {
    // console.log("Key saved to local storage.");
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (
    msg.type === "START_MAIN" &&
    msg.walletKey &&
    msg.secretKey &&
    !isRunning
  ) {
    // const encoder = new TextEncoder();
    // const tempseckey = encoder.encode(msg.secretKey);
    // console.log(tempseckey);
    // const uint8Array = new Uint8Array(msg.secretKey);
    ensureOffscreenAndSendKeys(msg.walletKey, msg.secretKey);
    console.log("huah");
    chrome.storage.local.set({isConnected: true});
    sendResponse({ type: "connected", isConnected: true });
    isRunning = true;
    // main({ walletKey: msg.walletKey, secretKey: uint8Array });
    // console.log("response sent");
    return true;
  } else if (msg.type === "CHECK_KEY") {
    // console.log("hi");

    chrome.storage.local.get(["secretKey", "walletKey"], function (data) {
      if(data.secretKey && data.walletKey){
        sendResponse({
        type: "fromServiceWorker",
        secretKey: data.secretKey,
        walletKey: data.walletKey,
      });
      } else{
        sendResponse({
          type: "fromServiceWorker",
          error: "Not valid"
        })
      }
    });
    return true;
  } else if (msg.type === "disconnect") {
    if (isRunning) {
      chrome.runtime.sendMessage({ type: "disconnectWS" },function(response){
        if(response.isConnected === false){
            chrome.offscreen.closeDocument();
        } else{
          console.log("Error in disconnecting");
        }
      });

      isRunning = false;
      chrome.storage.local.set({isConnected: false});
      sendResponse({ type: "disconnected" });
    }
    return true;
  } else if(msg.type === "CHECK_CONN"){
    chrome.storage.local.get(["isConnected"], function (data) {
      sendResponse({
        type: "fromServiceWorker",
        isConnected: data.isConnected
      })
    });
  }
});

// async function main({ walletKey,secretKey }: { walletKey?: string,secretKey: Uint8Array }) {
//   // Ensure the keypair is created properly
//   // console.log(Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY!)).byteLength)
//   const keypair = Keypair.fromSecretKey(secretKey, {
//     skipValidation: true,
//   });
//   ws = new WebSocket("wss://uptimechecker-hub.onrender.com");
//   // ws = new WebSocket("ws://localhost:443");
//   let ipaddr: string;

//   ws.onerror = (error) => {
//     console.error("WebSocket error:", error);
//   };

//   console.log("main function called.");
//   ws.onmessage = async (event) => {
//     // console.log("message");
//     const data = JSON.parse(event.data);
//     if (data.type === "signup") {
//       CALLBACKS[data.data.callbackId]?.(data.data);
//       delete CALLBACKS[data.data.callbackId];
//     } else if (data.type === "validate") {
//       await validateHandler(ws, data.data, keypair);
//     }
//   };

//   ws.onopen = async () => {
//     try {
//       await fetch("http://api.ipify.org")
//         .then((response) => response.text())
//         .then((ip) => {
//           ipaddr = ip;
//         //   console.log("My public IP address is: " + ip);
//         })
//         .catch((error) => {
//           console.error("Error fetching IP:", error);
//         });
//       console.log("WebSocket connection opened");
//       const callbackId = randomUUIDv7();
//       // console.log("Generated callbackId:", callbackId);

//       CALLBACKS[callbackId] = (data) => {
//         validatorId = data.validatorId;
//       };
//       const signedMessage = await signMessage(
//         `Signed message for ${callbackId}, ${keypair.publicKey}`,
//         keypair
//       );
//       // console.log("Message signed");
//     //   console.log("This is the ip:", ipaddr);

//       ws.send(
//         JSON.stringify({
//           type: "signup",
//           data: {
//             callbackId,
//             ip: ipaddr,
//             publicKey: keypair.publicKey.toBase58(),
//             walletAddress: walletKey,
//             signedMessage,
//           },
//         })
//       );
//       // console.log("signed up");
//     } catch (err) {
//       console.error("Error in onopen:", err);
//     }
//   };
// }

// async function disconnectWS(ws: WebSocket){
//   await ws.close(1000,"Connection Closed on user request.")
//   console.log("Disconnected");
//   chrome.offscreen.closeDocument();
//   return;
// }

// async function validateHandler(
//   ws: WebSocket,
//   {
//     url,
//     callbackId,
//     websiteId,
//   }: { url: string; callbackId: string; websiteId: string },
//   keypair: Keypair
// ) {
//   console.log(`Validating ${url}`);
//   const startTime = Date.now();
//   const signature = await signMessage(`Replying to ${callbackId}`, keypair);

//   try {
//     const response = await fetch(url, { mode: "no-cors" });
//     const endTime = Date.now();
//     const latency = endTime - startTime;
//     const status = response.status;

//     console.log(url);
//     console.log(status);
//     ws.send(
//       JSON.stringify({
//         type: "validate",
//         data: {
//           callbackId,
//           status: status === 200 ? "Good" : "Bad",
//           latency,
//           websiteId,
//           validatorId,
//           signedMessage: signature,
//         },
//       })
//     );
//   } catch (error) {
//     ws.send(
//       JSON.stringify({
//         type: "validate",
//         data: {
//           callbackId,
//           status: "Bad",
//           latency: 1000,
//           websiteId,
//           validatorId,
//           signedMessage: signature,
//         },
//       })
//     );
//     console.error(error);
//   }
// }

// async function signMessage(message: string, keypair: Keypair) {
//   const messageBytes = nacl_util.decodeUTF8(message);
//   const signature = nacl.sign.detached(messageBytes, keypair.secretKey);

//   return JSON.stringify(Array.from(signature));
// }

// main();

// setInterval(async () => {
//   // Place any recurring actions here (like periodic checks or updates)
// }, 10000);
