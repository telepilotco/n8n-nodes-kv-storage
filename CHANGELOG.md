
## 0.0.2
 - t.b.d.


## 0.0.1
- implemented scopes (EXECUTION, WORKFLOW, INSTANCE)
- implemented actions: getValue, setValue, incrementValue, listAllScopeKeys, listAllKeyValues, listAllKeyValuesInAllScopes
- Expires / TTL parameter is active by default in setValue action: you can disable it if you would like this key/value to be persisted until n8n restart
- key/value pairs that have TTL set will be automatically deleted after they expire
- automatic deletion task is running in background every 1 second
- Trigger node is listening for key/value update events in different scopes
- Trigger node allows filtering by eventType ( value was added, edited, deleted)
