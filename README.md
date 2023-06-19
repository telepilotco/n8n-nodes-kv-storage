# n8n-nodes-kv-storage

<img src="https://telepilot.co/logos/kv-storage.svg" alt="KV Storage logo" width="64" />

[n8n](https://www.n8n.io) community node that implements rudimentary key-value storage, stored in memory.
It is created for use-cases, when usage of Database or Redis is not desired, and `StaticData` or `Code` are not enough. 

`KV Storage` is putting values into buckets, that we called `Scopes`. 

### Recommended n8n setup

This node should be used with `EXECUTION_PROCESS=main`.

You could also run it in `own` mode, but in then actually only EXECUTION scope will be working, 
because n8n is starting each execution in separate node process and these processes neither share any data nor have IPC setup.

If you are using `own` process intentionally, you may consider using Redis instead of `KV Storage` node.

Same applies for multi-node setups: you may consider using Redis, since `KV Storage` does not have any backend 
and stores all the data in memory of one single n8n node.

## Scopes

### Execution

Values, put into this scope will be readable only by the nodes within the same Workflow Execution.

Multiple Execution scopes may coexist:  We differentiate between scopes of different executions by using `{{ $execution.id }}`

This is recommended for short-living values, like loop counters, calculating indices, or strings that need to be combined together.

Please consider keeping `Expires` / `TTL` parameter for such values, because otherwise these entries will never be deleted 
and can increase memory consumption of your n8n process

### Workflow

`Workflow`-scoped values will be accessible to every node within the same workflow (considering WorkflowID was not changed) 
in **every** Workflow Execution.

Multiple Workflow scopes may coexist: We differentiate between scopes of different executions by using `workflowId`

You may use this scope to store some temporary state, that needs to be shared between different executions.

`Expires` / `TTL` parameter is enabled by default, but you may turn it off if you would not like that your values are
automatically deleted when expired.


### Instance

This is global scope scope: values put here will be shared between all n8n workflows running on single n8n node.

There is only one Instance scope: we are not using any specifier.


### Cluster

This scope is not implemented.

Cluster-scoped values would be accessible to every node in n8n cluster.

## Node Actions

### setValue

Sets value based on key, Scope (Execution/Workflow/Instance) and specifier/ID of the Scope.

`Expires` / `TTL` parameter may be used if values need to be automatically deleted after some time.

Sends `added` or `updated` events that can be listened to using `KV Storage Trigger` node.

### incrementValue

Increments value based on key, Scope (Execution/Workflow/Instance) and specifier/ID of the Scope.
If value was not set in the past, it is initialized with `1`.

`Expires` / `TTL` parameter may be used if values need to be automatically deleted after some time.

Sends `added` or `updated` events that can be listened to using `KV Storage Trigger` node.

### getValue

Returns value, based on Scope, Scope specifier and key.

### listAllScopeKeys

Returns all keys within one Scope.

### listAllKeyValues

Returns all entries (key/value pairs) within one Scope.

### Debug: listAllKeyValuesInAllScopes

Returns all entries (key/value pairs) within all Scope.

## TTL and Value deletion

If `Expires` / `TTL` parameters were provided when value was set, these values will be automatically deleted after expiration.

Deletion job is schedules to run every `1000ms`.

Deletion job sends `deleted` events for every key that is deleted. You can listen to this event using `KV Storage Trigger` node.

## Trigger Node

With `KV Storage Trigger` node you can listen to `added` `edited` and `deleted` events in respective scopes.

If you select Workspace scope, you must provide workflowId (or comma-separated list of multiple workflowIds) that will be observed.

## Contributions and development

To test this node on local npm installation, you can use `make run` command.

You can also use `make prepublish` target to auto-format and lint-fix your code before submitting your changes. 

Please refer to `Makefile`.


## License

This project is licensed under MIT License.