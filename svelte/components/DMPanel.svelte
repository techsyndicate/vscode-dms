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
    socket.emit("status", { user: message.sender, status: 'online'})
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
      <svg 
      class="notif-icon"
      on:click={() => {
        tsvscode.postMessage({ type: 'close' });
      }}
      xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 416 416" style="enable-background:new 0 0 512 512" xml:space="preserve"><g>
        <g xmlns="http://www.w3.org/2000/svg">
          <g>
            <g>
              <path d="M208,416c23.573,0,42.667-19.093,42.667-42.667h-85.333C165.333,396.907,184.427,416,208,416z" fill="#ffffff" data-original="#000000" style=""/>
              <path d="M336,288V181.333c0-65.6-34.88-120.32-96-134.827V32c0-17.707-14.293-32-32-32s-32,14.293-32,32v14.507     c-61.12,14.507-96,69.227-96,134.827V288l-42.667,42.667V352h341.333v-21.333L336,288z" fill="#ffffff" data-original="#000000" style=""/>
            </g>
          </g>
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        <g xmlns="http://www.w3.org/2000/svg">
        </g>
        </g></svg>
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
          if (messageInput != "") {
          message.message = messageInput;
          let date = new Date();
          message.date = date;
          socket.emit('send-message', JSON.stringify(message));
          const messagesArea = document.getElementById('messages-area');
          messagesArea.innerHTML = messagesArea.innerHTML + messageInflator(message);
          document.sendMessage.reset()
          window.scrollTo(0,document.body.scrollHeight);
          }
        }}>
        <input
          class="message-input"
          id="message-input"
          placeholder="Message"
          value=""
          autofocus
          on:click={()=> {
            window.scrollTo(0,document.body.scrollHeight);
          }}/>
      </form>
    </div>
  </div>
</main>
