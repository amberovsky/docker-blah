/**
 * Create new div with error
 *
 * @param {string} error - error text
 */
function addError(error) {
    $('.for_errors').append('<div class="row"><div class="col-sm-12"><div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' + error + '</div></div></div>');
}

/**
 * @param {string} text - raw text
 * @returns {string} - escaped text for terminal
 */
function escapeTerminalText(text) {
    return validator
        .escape(text + '')
        .replace(/ /g, '&nbsp;')
        .replace(/(?:\r\n|\r|\n)/g, '<br />');
}

/**
 * Add text to a terminal and scroll down
 * 
 * @param {jQuery} terminal - query textarea object
 * @param {string} text - text to add
 */
function addTextToLogTerminal(terminal, text) {
    terminal.html(terminal.html() + escapeTerminalText(text));
    terminal.scrollTop(terminal[0].scrollHeight);
}

/**
 * Add error text to a terminal and scroll down
 *
 * @param {jQuery} terminal - query textarea object
 * @param {string} text - text to add
 */
function addErrorTextToLogTerminal(terminal, text) {
    terminal.html(terminal.html() + '<span class="terminal-system-error">' + escapeTerminalText(text) + '</span>');
    terminal.scrollTop(terminal[0].scrollHeight);
}

/**
 * Add system info text to a terminal and scroll down
 *
 * @param {jQuery} terminal - query textarea object
 * @param {string} text - text to add
 */
function addSystemInfoTextToLogTerminal(terminal, text) {
    terminal.html(terminal.html() + '<span class="terminal-system-info">' + escapeTerminalText(text) + '</span>');
    terminal.scrollTop(terminal[0].scrollHeight);
}

/**
 * Add system event text to a terminal and scroll down
 *
 * @param {jQuery} terminal - query textarea object
 * @param {string} text - text to add
 */
function addSystemEventTextToLogTerminal(terminal, text) {
    terminal.html(terminal.html() + '<span class="terminal-system-event">' + escapeTerminalText(text) + '</span>');
    terminal.scrollTop(terminal[0].scrollHeight);
}

/**
 * Runs command in the attached mode. No input is allowed for now.
 *
 * @param terminal
 * @param nodeId
 * @param containerId
 * @param command
 * @param onDisconnect
 * 
 * @returns {websocket} - connection to docker-blah
 */
function executeAttachedCommand(terminal, nodeId, containerId, command, onDisconnect) {
    var
        socket = io.connect('/', {
            reconnection: false
        });

    socket.emit('command', {
        nodeId: nodeId,
        containerId: containerId,
        command: command
    });

    socket.on('disconnect', function () {
        addSystemEventTextToLogTerminal(terminal, '\n\n*** DISCONNECTED ***\n\n');

        return onDisconnect();
    });

    socket.on('data', function (response) {
        if (!response.error) {
            addTextToLogTerminal(terminal, response.data);
        } else {
            addErrorTextToLogTerminal(terminal, JSON.stringify(response.error));
            socket.disconnect();
        }
    });
    
    return socket;
}
