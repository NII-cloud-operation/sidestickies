update_index = {
	maxProcesses = 1,
	delay = 1,
	onCreate  = "/usr/local/bin/update-index ^pathname",
	onModify  = "/usr/local/bin/update-index ^pathname",
	onMove    = "/usr/local/bin/update-index ^d.pathname",
}

sync{update_index, source="/home/jovyan"}