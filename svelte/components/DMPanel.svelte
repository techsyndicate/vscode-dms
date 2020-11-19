<script lang="ts">
  import { onMount } from "svelte";
  import axios from "axios";

  let error = null;
  let status = ""
  let finalMessages = [];
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

  const sendSocketId = async () => {
    socket.on("connect", async (data) => {
      await axios.get(`${apiBaseUrl}/api/users/socket?access_token=${accessToken}&socket_id=${socket.id}`
      );
    });
    socket.emit("status", "online")
  };

  const getStatus = async() => {
    const res = await axios.get(
      `${apiBaseUrl}/api/users/${message.receiver}/status?access_token=${accessToken}`
    );
    return res.data.status
  }

  const getSenderUsername = async () => {
    const res = await axios.get(
      `${apiBaseUrl}/api/users?access_token=${accessToken}`
    );
    message.sender = res.data.username;
  };

  const getMessages = async() => {
      const res = await axios.get(`${apiBaseUrl}/api/messages/${message.receiver}?access_token=${accessToken}`)
      let messages = res.data
      return messages
  }

  onMount(async () => {
    await getSenderUsername();
    await sendSocketId();
    if (message.sender < message.receiver) {
      message.conversation_id = `${message.sender}${message.receiver}`;
    } else {
      message.conversation_id = `${message.receiver}${message.sender}`;
    }
    status = await getStatus()
    finalMessages = await getMessages();
    initSocket();
    console.log(document.body)
    window.scrollTo(0, document.body.scrollHeight);
  });

  function dateToString(date) {
      return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  }

  function messageInflator(message) {
        date = dateToString(message.date)
        return `<div class="msg"><div class="message-inline"><img src="https://github.com/${message.sender}.png" alt=${message.sender} class="msg-img"><h3 class="dm-name">${message.sender}<span class="date">${date}</span> </h3></div><div class="msg-container"><h4 class="msg-content">${message.message}</h4></div></div><br>`;
    }

</script>

<main>
  <div class="navbar">
    <div class="navbar-inline">
      <img src={imageUrl} alt={username} class="dm-img" />
      <a class="name-hyperlink" style="text-decoration: none;color: white;" href="https://github.com/{username}"><h3 class="dm-name">{username}</h3></a>
    </div>
    <h4 class="dm-status">{status}</h4>
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
              class="date">{dateToString(new Date(message.date))}</span>
          </h3>
        </div>
        <div class="msg-container">
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
        action="" name="sendMessage"
        on:submit={() => {
          let messageInput = document.getElementById('message-input').value;
          message.message = messageInput;
          let date = new Date();
          message.date = date;
          socket.emit('send-message', JSON.stringify(message));
          const messagesArea = document.getElementById('messages-area');
          messagesArea.innerHTML = messagesArea.innerHTML + messageInflator(message);
          document.sendMessage.reset()
          window.scrollTo(0,document.body.scrollHeight);
        }}>
        <input
          class="message-input"
          id="message-input"
          placeholder="Message"
          value=""
          on:click={()=> {
            window.scrollTo(0,document.body.scrollHeight);
          }}/>
      </form>
    </div>
  </div>
</main>
