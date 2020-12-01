<script lang="ts">
    import { onMount } from "svelte";
    import axios from 'axios';

    let users = [];
    let error = null;

    const fetchData = async () => { 
        try {
            const res = await axios.get(`${apiBaseUrl}/api/users/contacts?access_token=${accessToken}`);
            users = res.data;
        } catch (err) {
            error = err.message
        }
     }

    onMount(async () => {
      await fetchData()
    });
</script>

<style>
    .name-input {
        width: 200px;
        padding-left: 10px;
    }
    .user {
        margin-bottom: 10px;
    }
    .submit-button {
        width: 200px;
    }
</style>

<main>
    <b><h1>Create a Group DM</h1></b>
    <br>
    <form
        action=""
        name="createGroupDM"
        on:submit="{() => {
            const nameOfGroup = document.getElementById('name-input').value;
            const checkedUsers = []
            let inputElements = document.getElementsByClassName('user');
            for(let i=0; i < inputElements.length; i++){
                if(inputElements[i].checked){
                    const checkedValue = inputElements[i].value;
                    checkedUsers.push(checkedValue)
                }
            }
            
            if(checkedUsers.length < 1) {
                const errorP = document.getElementById('error')
                errorP.innerHTML = 'select at least 1 member'
            }
            else {
                if(checkedUsers.length > 4) {
                    const errorP = document.getElementById('error')
                    errorP.innerHTML = 'you cannot select more than 4 members'
                }
                else {
                    const formData = {
                        name: nameOfGroup,
                        members: checkedUsers
                    }
                    tsvscode.postMessage({ type: 'formSubmission', value: formData });
                    document.createGroupDM.reset()
                    const errorP = document.getElementById('error')
                    errorP.innerHTML = ''
                }
            }
        }}"
    >
        <input placeholder="Name" class="name-input" value="" id="name-input" required>
        <br>
        <b><h2>Select members (Max 4)</h2></b>
        <p id="error"></p>
        <br>
        <div id="mutual-list">
            {#each users as user}
                <label><input class='user' type='checkbox' name="member" value="{user.username}"/> {user.username} </label><br>
            {:else}
                <p>loading..</p>
            {/each}
        </div>
        <br>
        <button class="submit-button" type="submit">Create Group DM</button>
    </form>
</main>
