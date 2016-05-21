/**
 * Create new div with error
 *
 * @param {string} error - error text
 */
function addError(error) {
    $('.for_errors').append('<div class="col-sm-12"><div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' + error + '</div></div>');
}

/**
 * Add text to the textarea and scroll down
 * 
 * @param {jQuery} terminal - query textarea object
 * @param {string} text - text to add
 */
function addTextToLogTerminal(terminal, text) {
    terminal.html(terminal.html() + text.replace(/(?:\r\n|\r|\n)/g, '<br />'));
    terminal.scrollTop(terminal[0].scrollHeight);

}