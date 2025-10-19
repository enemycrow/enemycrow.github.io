# @enemycrow/sw-logger

Helpers to add logging to your Service Worker (IndexedDB-based) and a small client script to request those logs from pages.

Usage

1. In your Service Worker (e.g. `sw.js`) import the helpers:

```js
importScripts('/npm/sw-logger/dist/sw-helpers.js');

// use writeLog
self.__swLogger && self.__swLogger.writeLog && self.__swLogger.writeLog('SW started');
```

The helpers expose `self.__swLogger.writeLog(msg)` and `self.__swLogger.readAllLogs(limit)`.

2. In any page include the client script and call `window.requestSWLogs()`:

```html
<script src="/npm/sw-logger/dist/client.js"></script>
<script>window.requestSWLogs(200);</script>
<div id="sw-logs"></div>
```

This will print logs to console and render them into `#sw-logs` if present.

Notes

- The logger uses IndexedDB inside the Service Worker and keeps a capped number of logs.
- This is meant for debugging and development; in production be mindful of privacy and storage size.
