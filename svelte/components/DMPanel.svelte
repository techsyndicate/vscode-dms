<script lang="ts">
  import { append, text } from "svelte/internal";
  import { onMount } from "svelte";
  import axios from "axios";
  import * as j from "jquery";

  let error = null;
  let finalMessages = [];
  let socketId = "";
  let date = new Date();
  let message = {
    access_token: accessToken,
    sender: "",
    receiver: username,
    date: date,
    type: "text",
    message: "",
    conversation_id: "",
  };

  const socket = io.connect(`${apiBaseUrl}`);
  const sendSocketId = async () => {
    socket.on("connect", async (data) => {
      await axios.get(
        `${apiBaseUrl}/api/users/socket?access_token=${accessToken}&socket_id=${socket.id}`
      );
    });
  };

  const getSenderUsername = async () => {
    const res = await axios.get(
      `${apiBaseUrl}/api/users?access_token=${accessToken}`
    );
    message.sender = res.data.username;
  };

  onMount(async () => {
    await getSenderUsername();
    await sendSocketId();
    if (message.sender < message.receiver) {
      message.conversation_id = `${message.sender}${message.receiver}`;
    } else {
      message.conversation_id = `${message.receiver}${message.sender}`;
    }
  });

  const newMessage = {
    date: "2020-11-26 at 6:41 PM",
    sender: "sheldor1510",
    receiver: "laxyapahuja",
    type: "text",
    message: "example dede",
    conversation_id: "laxyapahujasheldor1510",
  };

  const oldMessages = [
    {
      date: "2020-11-26 at 6:41 PM",
      sender: "sheldor1510",
      receiver: "laxyapahuja",
      type: "text",
      message: "example dede",
      conversation_id: "laxyapahujasheldor1510",
    },
    {
      date: "2020-11-26 at 6:41 PM",
      sender: "sheldor1510",
      receiver: "laxyapahuja",
      type: "text",
      message: "example dede 2",
      conversation_id: "laxyapahujasheldor1510",
    },
    {
      date: "2020-11-26 at 6:41 PM",
      sender: "sheldor1510",
      receiver: "laxyapahuja",
      type: "text",
      message: "example dede 3",
      conversation_id: "laxyapahujasheldor1510",
    },
    {
      date: "2020-11-26 at 6:41 PM",
      sender: "sheldor1510",
      receiver: "laxyapahuja",
      type: "text",
      message: "example dede 4",
      conversation_id: "laxyapahujasheldor1510",
    },
    {
      date: "2020-11-26 at 6:41 PM",
      sender: "sheldor1510",
      receiver: "laxyapahuja",
      type: "text",
      message: "example dede 5",
      conversation_id: "laxyapahujasheldor1510",
    },
  ];

  function oldIntoNew(arrayOfOldMessages) {
    for (let i = 0; i < arrayOfOldMessages.length; i++) {
      finalMessages.push(arrayOfOldMessages[i]);
    }
  }

  function newIntoExisting(newMessage) {
    finalMessages.push(newMessage);
  }

  oldIntoNew(oldMessages);
  newIntoExisting(newMessage);
  newIntoExisting({
    date: "2020-11-26 at 6:41 PM",
    sender: "sheldor1510",
    receiver: "laxyapahuja",
    type: "text",
    message: "example should be the last one",
    conversation_id: "laxyapahujasheldor1510",
  });

  function sendMessage() {}
</script>

<style>
  .navbar {
    height: 60px;
    width: 150%;
    background-color: #3c3c3c;
    margin-left: -5%;
    margin-right: -5%;
    margin-top: -1%;
    overflow: hidden;
    position: fixed;
    padding-left: 5%;
  }
  .dm-img {
    height: 35px;
    width: 35px;
    margin-top: 7px;
    border-radius: 50%;
  }
  .dm-name {
    margin-left: 15px;
    margin-top: -10px;
    font-weight: bold;
  }
  .navbar-inline {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    margin-top: 0.5%;
  }
  .dm-status {
    margin-top: -15px;
    font-size: 1rem;
    padding-left: 50px;
  }
  .input-box {
    height: 60px;
    width: 100%;
    background-color: #3c3c3c;
    margin-left: -5%;
    margin-right: -5%;
    overflow: hidden;
    position: fixed;
    padding-left: 5%;
    bottom: 0;
  }
  .message-input {
    height: 40px;
    width: inherit;
    filter: brightness(120%);
    margin-top: 10px;
    padding-left: 10px;
    font-size: 1.2rem;
  }
  .message-input:focus {
    outline: none;
  }
  .messages-area {
    padding-top: 5%;
  }
  .message-inline {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
  }
  .msg-img {
    height: 35px;
    width: 35px;
    margin-top: 15px;
    border-radius: 50%;
  }
  .msg-content {
    margin-top: -15px;
    font-size: 1rem;
    padding-left: 50px;
  }
</style>

<main>
  <div class="navbar">
    <div class="navbar-inline">
      <img src={imageUrl} alt={username} class="dm-img" />
      <h3 class="dm-name">{username}</h3>
    </div>
    <h4 class="dm-status">Online</h4>
  </div>
  {#if error}
    <p>Error: {error.message}</p>
  {/if}
  <div class="messages-area" id="messages-area">
    {#each finalMessages as message}
      <!-- single message div -->
      <div class="msg">
        <div class="message-inline">
          <img
            src="https://github.com/{message.sender}.png"
            alt={message.sender}
            class="msg-img" />
          <h3 class="dm-name">
            {message.sender}
            <span
              style="color: grey; margin-left: 10px;font-weight: normal; font-size: 1rem">{message.date}</span>
          </h3>
        </div>
        <div style="max-width: 300px">
          <h4 class="msg-content">{message.message}</h4>
        </div>
      </div><br />
      <!-- end of single message div -->
    {:else}
      <p>loading..</p>
    {/each}
  </div>
  <div class="input-box">
    <div class="input-inline">
      <form
        action=""
        on:submit={() => {
          let messageInput = document.getElementById('message-input').value;
          message.message = messageInput;
          let date = new Date();
          message.date = date;
          socket.emit('send-message', JSON.stringify(message));

          function messageInflator(message) {
            return `<div class="msg"><div class="message-inline"><img src="https://github.com/${message.sender}.png" alt=${message.sender} style="height: 35px;width: 35px;margin-top: 15px;border-radius: 50%;"><h3 class="dm-name">${message.sender} <span style="color: grey; margin-left: 10px;font-weight: normal; font-size: 1rem">${message.date}</span></h3></div><div style="max-width: 300px"><h4 class="msg-content">${message.message}</h4></div></div><br>`;
          }
          const messagesArea = document.getElementById('messages-area');
          messagesArea.innerHTML = messagesArea.innerHTML + messageInflator(message);
        }}>
        <input
          class="message-input"
          id="message-input"
          placeholder="Message"
          value="" />
      </form>
    </div>
  </div>
  <script>
    socket.on("receive-message", (msg) => {
      msg = msg.json();
      console.log(msg);
      newIntoExisting(msg);
    });
  </script>
</main>
