function initSocket() {
    console.log('socket initialized')
    const messagesArea = document.getElementById('messages-area')
    const Status = document.getElementById('dm-status')

    function dateToString(date) {
        return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    }

    function messageInflator(message) {
        date = dateToString(new Date(message.date))
        return `<div class="msg"><div class="message-inline"><img src="https://github.com/${message.sender}.png" alt=${message.sender} class="msg-img"><h3 class="dm-name">${message.sender}<span class="date">${date}</span> </h3></div><div style="max-width: 300px"><h4 class="msg-content">${message.message}</h4></div></div><br>`;
    }

    function imageInflator(message) {
        date = dateToString(new Date(message.date))
        return `<div class="msg"><div class="message-inline"><img src="https://github.com/${message.sender}.png" alt=${message.sender} class="msg-img"><h3 class="dm-name">${message.sender}<span class="date">${date}</span> </h3></div><img class="image-content" src="${message.message}"></div><br>`;
    }

    socket.on("receive-message", msg => {
        if (msg.sender == username) {
            if(msg.type == "text") {
                messagesArea.innerHTML = messagesArea.innerHTML + messageInflator(msg);
            }
            if(msg.type == "image") {
                messagesArea.innerHTML = messagesArea.innerHTML + imageInflator(msg);
            }
            window.scrollTo(0, document.body.scrollHeight);
        } else {
            tsvscode.postMessage({ type: 'notificationMessage', value: msg });
        }
    });
    socket.on("status", status => {
        console.log(status)
        if (status.user == username) {
            Status.innerHTML = status.status
        }
    })
}