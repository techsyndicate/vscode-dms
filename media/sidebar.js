async function initSidebar() {
    console.log('sidebar.js initialized')
    const contactsRoot = document.getElementById("contacts-root")

    socket.on('receive-message', msg => {
        if (msg.sender != user) {
            tsvscode.postMessage({ type: 'refresh' });
        }
    })
}