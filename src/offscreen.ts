import { v6 as randomUUIDv7 } from "uuid";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";

let ws: WebSocket;
let validatorId: string | null = null;
const CALLBACKS: { [callbackId: string]: (data: any) => void } = {};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "INIT_KEYS") {
    const walletKey: string = msg.walletKey;
    const secretKey: Uint8Array = new Uint8Array(msg.secretKey);

    console.log("Received walletKey and secretKey in offscreen");

    main({walletKey, secretKey});
  } else if (msg.type === "disconnectWS") {
    if (ws) {
      disconnectWS(ws);
      sendResponse({
        isConnected: false
      })
    }
  }
});

async function main({
  walletKey,
  secretKey,
}: {
  walletKey?: string;
  secretKey: Uint8Array;
}) {
  // Ensure the keypair is created properly
  // console.log(Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY!)).byteLength)
  const keypair = Keypair.fromSecretKey(secretKey, {
    skipValidation: true,
  });
  ws = new WebSocket("wss://uptimechecker-hub.onrender.com");
  // ws = new WebSocket("ws://localhost:443");
  let ipaddr: string;

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  console.log("main function called.");
  ws.onmessage = async (event) => {
    // console.log("message");
    const data = JSON.parse(event.data);
    if (data.type === "signup") {
      CALLBACKS[data.data.callbackId]?.(data.data);
      delete CALLBACKS[data.data.callbackId];
    } else if (data.type === "validate") {
      await validateHandler(ws, data.data, keypair);
    }
  };

  ws.onopen = async () => {
    try {
      await fetch("http://api.ipify.org")
        .then((response) => response.text())
        .then((ip) => {
          ipaddr = ip;
          //   console.log("My public IP address is: " + ip);
        })
        .catch((error) => {
          console.error("Error fetching IP:", error);
        });
      console.log("WebSocket connection opened");
      const callbackId = randomUUIDv7();
      // console.log("Generated callbackId:", callbackId);

      CALLBACKS[callbackId] = (data) => {
        validatorId = data.validatorId;
      };
      const signedMessage = await signMessage(
        `Signed message for ${callbackId}, ${keypair.publicKey}`,
        keypair
      );
      // console.log("Message signed");
      //   console.log("This is the ip:", ipaddr);

      ws.send(
        JSON.stringify({
          type: "signup",
          data: {
            callbackId,
            ip: ipaddr,
            publicKey: keypair.publicKey.toBase58(),
            walletAddress: walletKey,
            signedMessage,
          },
        })
      );
      // console.log("signed up");
    } catch (err) {
      console.error("Error in onopen:", err);
    }
  };
}

async function signMessage(message: string, keypair: Keypair) {
  const messageBytes = nacl_util.decodeUTF8(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);

  return JSON.stringify(Array.from(signature));
}

async function validateHandler(
  ws: WebSocket,
  {
    url,
    callbackId,
    websiteId,
  }: { url: string; callbackId: string; websiteId: string },
  keypair: Keypair
) {
  console.log(`Validating ${url}`);
  const startTime = Date.now();
  const signature = await signMessage(`Replying to ${callbackId}`, keypair);

  try {
    const response = await fetch(url, { mode: "no-cors" });
    const endTime = Date.now();
    const latency = endTime - startTime;
    const status = response.status;

    let ipaddr;
    await fetch("http://api.ipify.org")
        .then((response) => response.text())
        .then((ip) => {
          ipaddr = ip;
          //   console.log("My public IP address is: " + ip);
        })
        .catch((error) => {
          console.error("Error fetching IP:", error);
        });


    console.log(url);
    console.log(status);
    ws.send(
      JSON.stringify({
        type: "validate",
        data: {
          callbackId,
          status: status === 200 ? "Good" : "Bad",
          latency,
          websiteId,
          validatorId,
          signedMessage: signature,
          ipaddr
        },
      })
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "validate",
        data: {
          callbackId,
          status: "Bad",
          latency: 1000,
          websiteId,
          validatorId,
          signedMessage: signature,
        },
      })
    );
    console.error(error);
  }
}

function disconnectWS(ws: WebSocket) {
        ws.close(1000, "Connection Closed on user request.");
        console.log("Disconnected");
        return;
}

setInterval(async () => {
  // Place any recurring actions here (like periodic checks or updates)
}, 10000);
