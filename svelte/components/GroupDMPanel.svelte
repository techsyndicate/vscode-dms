<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Consolas" rel="stylesheet">
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import axios from "axios";
  import firebase from "firebase";

  let error = null; // shows error in chat
  let status = ""
  let finalMessages = [];
  let date = new Date();
  let message = {
    access_token: accessToken,
    sender: "",
    receiver: groupName,
    date: date,
    type: "text",
    message: "",
    conversation_id: conversation_id,
    group: true
  };

  let firebaseConfig = {
    apiKey: firebaseSecrets.env.apiKey,
    authDomain: firebaseSecrets.env.authDomain,
    databaseURL: firebaseSecrets.env.databaseUrl,
    projectId: firebaseSecrets.env.projectId,
    storageBucket: firebaseSecrets.env.storageBucket,
    messagingSenderId: firebaseSecrets.env.messagingSenderId,
    appId: firebaseSecrets.env.appId,
  }

  firebase.initializeApp(firebaseConfig);

  const read = async () => {
    await axios.post(`${apiBaseUrl}/api/users/read?access_token=${accessToken}&conversation_id=${conversation_id}`)
    tsvscode.postMessage({type: "refreshSidebar"})
  }

  const sendSocketId = async () => {
    socket.on("connect", async (data) => {
      await axios.get(
        `${apiBaseUrl}/api/users/socket?access_token=${accessToken}&socket_id=${socket.id}`
      );
    });
    socket.emit("status", { user: accessToken, status: 'online'})
  };

  const getSenderUsername = async () => {
    const res = await axios.get(
      `${apiBaseUrl}/api/users?access_token=${accessToken}`
    );
    message.sender = res.data.username;
    clientUsername = res.data.username;
  };

  const getMessages = async () => {
    const res = await axios.get(
      `${apiBaseUrl}/api/messages/group/${message.conversation_id}?access_token=${accessToken}`
    );
    const messages = res.data;
    for (let i = 0; i < messages.length; i++) {
           const initialMessage = messages[i].message;
           const newMessage = initialMessage.replace(/\\n/g, '<br/>').replace(/\\r/g, '').replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\\'/g, "\'").replace(/\\"/g, '\"');
           messages[i].message = newMessage;
    }
    return messages;
  };

  /**
   * This handler retrieves the images from the clipboard as a base64 string and returns it in a callback.
   *
   * @param pasteEvent
   * @param callback
   */
  function retrieveImageFromClipboardAsBase64(
    pasteEvent,
    callback,
    imageFormat
  ) {
    if (pasteEvent.clipboardData == false) {
      if (typeof callback == "function") {
        callback(undefined);
      }
    }

    var items = pasteEvent.clipboardData.items;

    if (items == undefined) {
      if (typeof callback == "function") {
        callback(undefined);
      }
    }

    for (var i = 0; i < items.length; i++) {
      // Skip content if not image
      if (items[i].type.indexOf("image") == -1) continue;
      // Retrieve image on clipboard as blob
      var blob = items[i].getAsFile();

      // Create an abstract canvas and get context
      var mycanvas = document.createElement("canvas");
      var ctx = mycanvas.getContext("2d");

      // Create an image
      var img = new Image();

      // Once the image loads, render the img on the canvas
      img.onload = function () {
        // Update dimensions of the canvas with the dimensions of the image
        mycanvas.width = this.width;
        mycanvas.height = this.height;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Execute callback with the base64 URI of the image
        if (typeof callback == "function") {
          callback(mycanvas.toDataURL(imageFormat || "image/png"));
        }
      };

      // Crossbrowser support for URL
      var URLObj = window.URL || window.webkitURL;

      // Creates a DOMString containing a URL representing the object given in the parameter
      // namely the original Blob
      img.src = URLObj.createObjectURL(blob);
    }
  }

  window.addEventListener(
    "paste",
    function (e) {
      retrieveImageFromClipboardAsBase64(
        e,
        function (imageDataBase64) {
          if (imageDataBase64) {
            // assigns randomly generated string for image name
            const fileName = (length = 12) => Math.random().toString(20).substr(2, length);
            const firebaseStorage = firebase.storage().ref().child(fileName());

            const uploadTask = firebaseStorage.putString(
              imageDataBase64,
              "data_url"
            );
            let imageUrl = "";

            uploadTask.on(
              "state_changed",
              function (snapshot) {},
              function (error) {},
              () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadUrl) => {
                  imageUrl = downloadUrl;

                  // need to take that url and pass it as the message property of the message object
                  message.message = imageUrl;
                  // set type as image
                  message.type = "image";
                  // set current date as message date
                  let date = new Date();
                  message.date = date;
                  // send the message
                  socket.emit("send-message", JSON.stringify(message));
                  // inflate the message
                  const messagesArea = document.getElementById("messages-area");
                  messagesArea.innerHTML =
                    messagesArea.innerHTML + firebaseImageInflator(message);
                  document.sendMessage.reset();
                  const messageInputBox = document.getElementById(
                    "message-input"
                  );
                  messageInputBox.click();
                  window.scrollTo(0, document.body.scrollHeight);
                });
              }
            );
          }
        },
        "png"
      );
    },
    false
  );

  onMount(async () => {
    await read();
    await getSenderUsername();
    await sendSocketId();
    finalMessages = await getMessages();
    const messageInputBox = document.getElementById("message-input");
    messageInputBox.click();
    await initSocket();
    window.scrollTo(0, document.body.scrollHeight);
  });

  function dateToString(date) {
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  }

  function isUrl(s) {
   var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
   return regexp.test(s);
  }

  function isImageUrl(url) {
    return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
  }

  function messageInflator(message) {
    date = dateToString(message.date);
    if (isUrl(message.message)) {
      if (isImageUrl(message.message)) {
        // render the image
        return `<div class="msg"><div class="message-inline"><img src="https://github.com/${message.sender}.png" alt=${message.sender} class="msg-img"><h3 class="dm-name">${message.sender}<span class="date">${date}</span> </h3></div><a href="${message.message}"><img class="image-content" src="${message.message}"></a></div><br>`;
      } else {
        // hyperlink message
        return `<div class="msg"><div class="message-inline"><img src="https://github.com/${message.sender}.png" alt=${message.sender} class="msg-img"><h3 class="dm-name">${message.sender}<span class="date">${date}</span> </h3></div><div class="msg-container"><a href="${message.message}" style="text-decoration: none;"><h4 class="msg-content">${message.message}</h4></a></div></div><br>`;
      }
    } else {
      // standard text message
      return `<div class="msg"><div class="message-inline"><img src="https://github.com/${message.sender}.png" alt=${message.sender} class="msg-img"><h3 class="dm-name">${message.sender}<span class="date">${date}</span> </h3></div><div class="msg-container"><h4 class="msg-content">${message.message}</h4></div></div><br>`;
    }
  }

  // inflate images when using Ctrl + V
  function firebaseImageInflator(message) {
    date = dateToString(new Date(message.date));
    return `<div class="msg"><div class="message-inline"><img src="https://github.com/${message.sender}.png" alt=${message.sender} class="msg-img"><h3 class="dm-name">${message.sender}<span class="date">${date}</span> </h3></div><a href="${message.message}"><img class="image-content" src="${message.message}"></a></div><br>`;
  }
</script>

<main>
  <div class="navbar">
    <div class="navbar-inline">
      <img src={imageUrl} alt={groupName} class="dm-img" />
      <h3 class="dm-name">
          {groupName}
        </h3>
      <div
        title="Close this tab and continue receiving notifications while you're working">
        <svg
          class="notif-icon"
          id="notif-icon"
          on:click={() => {
            tsvscode.postMessage({ type: 'close' });
          }}
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          xmlns:svgjs="http://svgjs.com/svgjs"
          version="1.1"
          width="512"
          height="512"
          x="0"
          y="0"
          viewBox="0 0 416 416"
          style="enable-background:new 0 0 512 512"
          xml:space="preserve"><g>
            <g xmlns="http://www.w3.org/2000/svg">
              <g>
                <g>
                  <path
                    d="M208,416c23.573,0,42.667-19.093,42.667-42.667h-85.333C165.333,396.907,184.427,416,208,416z"
                    fill="#ffffff"
                    data-original="#000000"
                    style="" />
                  <path
                    d="M336,288V181.333c0-65.6-34.88-120.32-96-134.827V32c0-17.707-14.293-32-32-32s-32,14.293-32,32v14.507     c-61.12,14.507-96,69.227-96,134.827V288l-42.667,42.667V352h341.333v-21.333L336,288z"
                    fill="#ffffff"
                    data-original="#000000"
                    style="" />
                </g>
              </g>
            </g>
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
            <g xmlns="http://www.w3.org/2000/svg" />
          </g></svg>
      </div>
        <div
        title="Delete group"
        id="delete-group"
        on:click="{() => {
          tsvscode.postMessage({ type: 'delete', value: { conversation_id: conversation_id, clientUsername: clientUsername, adminUsername: adminUsername } });
        }}"
        >
          <img src="https://cdn.discordapp.com/attachments/767769692001402910/782661973631827988/delete.svg" alt="delete-icon" class="delete-icon"/>
        </div>
    </div>
    <h4 class="dm-status" id="dm-status">{membersString}</h4>
  </div>
  {#if error}
    <p>Error: {error.message}</p>
  {/if}
  <div class="messages-area" id="messages-area">
    {#each finalMessages as message}
      {#if message.type == 'text'}
        <!-- single message div -->
        <div class="msg">
          <div class="message-inline">
            <img
              src="https://github.com/{message.sender}.png"
              alt={message.sender}
              class="msg-img" />
            <h3 class="dm-name">
              {message.sender}
              <span class="date">{dateToString(new Date(message.date))}</span>
            </h3>
          </div>
          <div class="msg-container">
            {#if isUrl(message.message)}
              {#if isImageUrl(message.message)}
                  <a href={message.message} style="text-decoration: none"><img class="image-content" src="{message.message}" alt="{message.sender}"></a>
              {:else}
                  <a href={message.message} style="text-decoration: none"><h4 class="msg-content">{message.message}</h4></a>
              {/if}
              {:else}
                 <h4 class="msg-content">{message.message}</h4>
            {/if}
          </div>
        </div><br />
        <!-- end of single message div -->
      {/if}
      {#if message.type == 'image'}
        <!-- single message div -->
        <div class="msg">
          <div class="message-inline">
            <img
              src="https://github.com/{message.sender}.png"
              alt={message.sender}
              class="msg-img" />
            <h3 class="dm-name">
              {message.sender}
              <span class="date">{dateToString(new Date(message.date))}</span>
            </h3>
          </div>
          <div class="msg-container">
            <a href={message.message}>
              <img
                class="image-content"
                src={message.message}
                alt={message.sender} />
            </a>
          </div>
        </div><br />
        <!-- end of single message div -->
      {/if}
      {#if message.type == 'code'}
        <!-- single message div -->
        <div class="msg">
          <div class="message-inline">
            <img
              src="https://github.com/{message.sender}.png"
              alt={message.sender}
              class="msg-img" />
            <h3 class="dm-name">
              {message.sender}
              <span class="date">{dateToString(new Date(message.date))}</span>
            </h3>
          </div>
          <div class="msg-container">
            <div class="code">
              {@html message.message}
            </div>
          </div>
        </div><br />
        <!-- end of single message div -->
      {/if}
    {:else}
      <p id="loading">loading..</p>
    {/each}
  </div>
  <div class="input-box">
    <div class="input-inline">
      <form
        action=""
        name="sendMessage"
        on:submit={() => {
          let messageInput = document.getElementById('message-input').value;
          if (messageInput != '') {
            message.message = messageInput;
            let date = new Date();
            message.date = date;
            message.type = 'text';
            socket.emit('send-message', JSON.stringify(message));
            const loadingText = document.getElementById('loading')
            if(loadingText != null) {
              loadingText.innerHTML = ''
            }
            const messagesArea = document.getElementById('messages-area');
            messagesArea.innerHTML = messagesArea.innerHTML + messageInflator(message);
            document.sendMessage.reset();
            tsvscode.postMessage({type: "refreshSidebar"})
            window.scrollTo(0, document.body.scrollHeight);
          }
        }}>
        <input
          class="message-input"
          id="message-input"
          placeholder="Message"
          value=""
          autofocus
          on:click={() => {
            window.scrollTo(0, document.body.scrollHeight);
          }} />
      </form>
    </div>
  </div>
</main>
