function get_index_by_id(elements, id) {
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].id == id) {
			return i
		}
	}
	return -1
}

function console_debug() {
	if (window.queue_debug !== undefined) console.log.apply(this, arguments);
}