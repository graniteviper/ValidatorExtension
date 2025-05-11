var userisValidator = false;
// let isConnected: boolean;


document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("walletInput") as HTMLInputElement;
  // const group = document.getElementsByClassName("input-group");
  const Submitbutton = document.getElementById(
    "submitBtn"
  ) as HTMLButtonElement;
  const Disconnectbutton = document.getElementById(
    "disconnectBtn"
  ) as HTMLButtonElement;
  const Connectbutton = document.getElementById(
    "connectBtn"
  ) as HTMLButtonElement;

  updateButtonVisibility(false);


  chrome.runtime.sendMessage({type: "CHECK_KEY"}, (response) => {
    if (response && response.type === "fromServiceWorker") {
      if(response.secretKey && response.walletKey){
        // console.log("Received secret key:", response.secretKey);
        userisValidator = true;
      } else{
        userisValidator = false;
      }
      updateButtonVisibility(userisValidator);
    }
  });

  // chrome.runtime.sendMessage({type: "CHECK_CONN"}, (response) => {
  //   if (response && response.type === "fromServiceWorker") {
  //     // isConnected = response.isConnected;
  //     updateButtonVisibility(userisValidator);
  //   }
  // });

  function updateButtonVisibility(isValidator: boolean) {

    chrome.storage.local.get(["isConnected"],function(data){
      if (isValidator && !data.isConnected) {
        Submitbutton.style.display = "none";
        Connectbutton.style.display = "block";
        Disconnectbutton.style.display = "none";
        input.style.display = "none";
      } else if(!isValidator) {
        Submitbutton.style.display = "block";
        Disconnectbutton.style.display = "none";
        input.style.display = "block";
        Connectbutton.style.display = "none";
      } else if(isValidator && data.isConnected){
        Submitbutton.style.display = "none";
        input.style.display = "none";
        // group.style.display = "none";
        Connectbutton.style.display = "none";
        Disconnectbutton.style.display = "block";
      }
    })
  }

  Submitbutton.addEventListener("click", () => {
    const walletKey = input.value.trim();
    if (!walletKey) return alert("Please enter a wallet public key");
    chrome.storage.local.set({ walletKey: walletKey }, function () {
      console.log("Wallet Address Registered");
    });
    userisValidator = true;
    updateButtonVisibility(userisValidator);
  });

  Connectbutton.addEventListener("click", () => {
    chrome.storage.local.get(["secretKey","walletKey"], function (data) {
      // console.log("Data is: ", data);
      chrome.runtime.sendMessage({ type: "START_MAIN", walletKey: data.walletKey,secretKey: data.secretKey},(response)=>{
        // console.log("Response is :", response);
        if(response.type==="connected" && response.isConnected === true){
          updateButtonVisibility(userisValidator);
        }
      });
    });
  });

  Disconnectbutton.addEventListener("click",()=>{
    chrome.runtime.sendMessage({type:"disconnect"},(response)=>{
      if(response.type === "disconnected"){
        updateButtonVisibility(userisValidator);
      }
    })
  })
});