# Milkblogs

Milkblogs is an attempt at a small blogging platform. It works mostly, and has 0 external dependencies, by storing everything on the local filesystem. This could make it useful, but also makes it painful to deploy onto most platforms that host nodejs projects; however it did work and was a good proof of concept for this method of storing data, where certain key/value pairs could be very large, and would bloat a system that wanted to index or sort it quickly.