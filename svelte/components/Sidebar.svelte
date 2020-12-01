<script lang="ts">
		import { onMount } from 'svelte';
    import axios from 'axios'

    let loadingState: "initial" | "more" | "refetch" | "ready" = "initial";
    let contacts = [];
    let unread = [];
    let error = null;
    
  const getUnread = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/users/unread?access_token=${accessToken}`)
      unread = res.data;
    } catch (err) {
      console.log(err)
    }
  }
    const fetchData = async () => { 
      try {
        const res = await axios.get(`${apiBaseUrl}/api/contacts?access_token=${accessToken}`);
        contacts = res.data;
      } catch (err) {
        error = err.message
      }
      loadingState = "ready";
     }

    onMount(async () => {
      await getUnread()
      await fetchData()
    });

    window.addEventListener("message", async (event) => {
    const message = event.data;
    switch (message.command) {
      case "refresh":
        await fetchData();
        await getUnread()
        for(let i=0; i< unread.length; i++) {
          const contactName = document.getElementById(unread[i])
          contactName.style.fontWeight = "800"
        }
        break;
    }
  });
</script>

<style>
  .contact-card {
    width: 219.5px;
    height: 60px;
    border-style: solid;
    border: none;
    margin-bottom: -20px;
    padding-top: 10px;
    padding-left: 20px;
    margin-left: -20px;
    overflow-x: hidden;
  }
  .contact-card:hover {
    background-color: #252526;
    filter: brightness(120%);
    cursor: pointer;
  }
  .contact-img {
    height: 30px;
    width: 30px;
    margin-top: 5px;
    border-radius: 50%;
  }
  .contact-name {
    margin-left: 15px;
    width: 16ch;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .inline {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
  }
  .add-button {
    height: 20px;
    width: 20px;
    margin-left: 40px;
    margin-top: 8px;
  }
  .add-button:hover {
    cursor: pointer;
  }
  .bold {
    font-weight: bold;
  }
</style>

<main>
  
  {#if error}
    <p>Error: {error.message}</p>
  {/if}
    <div class="inline">
      <h2>Contacts ({contacts.length})</h2>
    <div title="Create Group DM" on:click="{() => {
      tsvscode.postMessage({ type: 'onCreateDMPress' });
    }}"><img class="add-button" src="https://www.downloadclipart.net/large/19773-add-button-white-design.png" alt="add-button"></div>
    </div>
    <br>
    <div id="contacts-root">
    {#each contacts as contact}
      {#if contact.type == "group"}
          <div class="contact-card" id="{contact.conversation_id}-card" on:click={() => {
            tsvscode.postMessage({ type: 'onGroupPress', value: contact });
          }}>
            <div class="inline">
              <img class="contact-img" src="{contact.avatar_url}" alt="{contact.name}"/>
              {#if unread.includes(contact.conversation_id)}
                <b><h3 class="contact-name" id="{contact.conversation_id}">{contact.name}</h3></b>
              {:else}
              <h3 class="contact-name" id="{contact.conversation_id}">{contact.name}</h3>
              {/if}
            </div>
          </div><br>
      {:else}
          <div class="contact-card" id="{contact.conversation_id}-card" on:click={() => {
            tsvscode.postMessage({ type: 'onContactPress', value: contact });
          }}>
            <div class="inline">
              <img class="contact-img" src="{contact.avatar_url}" alt="{contact.username}"/>
              {#if unread.includes(contact.conversation_id)}
                <b><h3 class="contact-name bold" id="{contact.conversation_id}">{contact.username}</h3></b>
              {:else}
                <h3 class="contact-name" id="{contact.conversation_id}">{contact.username}</h3>
              {/if}
            </div>
          </div><br>
      {/if}
    {:else}
      <p>loading..</p>
    {/each}
  </div>
</main>