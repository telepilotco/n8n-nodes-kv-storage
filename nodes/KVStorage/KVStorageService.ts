import 'reflect-metadata';
import { Service } from 'typedi';
import { IDataObject } from "n8n-workflow";

const debug = require('debug')('kv-storage')

export enum Scope {
	ALL = 'ALL',
	EXECUTION = 'EXECUTION',
	WORKFLOW = 'WORKFLOW',
	INSTANCE = 'INSTANCE'
}

@Service()
export class KVStorageService {

	private map: Record<string, string> = {};

	private workflowListenersMap: Record<number, ((a: IDataObject)=>void)[]> = {}
	private instanceListeners: ((a: IDataObject)=>void)[] = []
	private executionListeners: ((a: IDataObject)=>void)[] = []

	private allListeners: ((a: IDataObject)=>void)[] = []

	constructor() {

	}

	listAllKeyValuesInAllScopes(): IDataObject {
		debug("listAllKeyValuesInAllScopes: ")
		let map_keys = Object.keys(this.map);
		const regExp = /scope:(\w+)-(.+):(.*)/

		const matched_entries: IDataObject = {}
		map_keys.filter(scopedKey => scopedKey.match(regExp)).map(scopedKey => {
			const m = scopedKey.match(regExp);
			//@ts-ignore
			const scope = m[1]
			//@ts-ignore
			const specifier = m[2]
			//@ts-ignore
			const key = m[3]

			const entry_key = `${scope}-${specifier}`

			if (Object.keys(matched_entries).includes(entry_key)) {
				//@ts-ignore
				matched_entries[entry_key].entries[key] = this.map[scopedKey]
			} else {
				matched_entries[entry_key] = {
					scope,
					specifier,
					entries: {[key]: this.map[scopedKey]} as IDataObject
				} as IDataObject
			}
		})
		return matched_entries;
	}


	listAllKeysInScope(scope: Scope, specifier = ''): IDataObject {
		debug("getAllKeysInScope: scope=" + scope + ";specifier=" + specifier)
		let map_keys = Object.keys(this.map);
		const regExp = new RegExp(`scope\\:${scope}-${specifier}\\:.*`, 'g')

		const matched_keys = map_keys.filter(scopedKey => scopedKey.match(regExp)).map(scopedKey => this.getKey(scopedKey))
		return { 'keys': matched_keys, scope, specifier };
	}

	listAllKeyValuesInScope(scope: Scope, specifier = ''): IDataObject {
		debug("getAllKeyValuesInScope: scope=" + scope + ";specifier=" + specifier)
		const regExp = new RegExp(`scope\\:${scope}-${specifier}\\:.*`, 'g')
		let map_keys = Object.keys(this.map);

		const matched_keys = map_keys.filter(k => k.match(regExp))
		let matched_entries: IDataObject = {}

		matched_keys.map((sK) => {
			const k = this.getKey(sK);
			matched_entries[k] = this.map[sK]
		})

		return {'entries': matched_entries, scope, specifier };
	}

	getValue(key: string, scope: Scope, specifier = ''): IDataObject {
		debug("getValue: key=" + key + ";scope=" + scope + ";specifier=" + specifier)
		const scopedKey = this.composeScopeKey(key, scope, specifier);
		return {'val': this.map[scopedKey]};
	}

	setValue(key: string, val: string, scope: Scope, specifier = ''): IDataObject {
		debug("setValue: key=" + key + ";val=" + val + ";scope=" + scope + ";specifier=" + specifier)
		const scopedKey = this.composeScopeKey(key, scope, specifier);
		this.map[scopedKey] = val;

		const timestamp = Date.now()
		const event = {
			scope,
			specifier,
			key,
			val,
			timestamp
		}

		if (this.allListeners.length > 0) {
			this.allListeners.map((callback) => {
				callback(event)
			})
		}

		if (scope === Scope.INSTANCE && this.instanceListeners.length > 0) {
			this.instanceListeners.map((callback) => {
				callback(event)
			})
		}

		if (scope === Scope.EXECUTION && this.executionListeners.length > 0) {
			this.executionListeners.map((callback) => {
				callback(event)
			})
		}
		if (scope === Scope.WORKFLOW) {
			Object.keys(this.workflowListenersMap).map(k => {
				if (specifier === k) {
					this.workflowListenersMap[Number(k)].map(callback => {
						callback(event)
					})
				}
			})
		}

		return { 'result': "OK" };
	}

	private composeScopeKey(key: string, scope: Scope, specifier = ''): string {
		debug("composeScopeKey: key=" + key + ";scope=" + scope + ";specifier=" + specifier)
		if (scope == Scope.EXECUTION) {
			return `scope:${scope}-${specifier}:${key}`
		} else if (scope == Scope.WORKFLOW) {
			return `scope:${scope}-${specifier}:${key}`
		} else if (scope == Scope.INSTANCE) {
			// specifier =
			return `scope:${scope}-${specifier}:${key}`
		}
		const scopedKey = `scope:${scope}:${key}`;
		debug("scopedKey=" + scopedKey)
		return scopedKey;
	}

	private getKey(scopedKey: string): string {
		const match = scopedKey.match(/scope:\w+-.*:(.*)/)
		return  match != null ? match[1]: "EMPTY";
	}

	addListener(scope: Scope, specifier: string, callback: (a: IDataObject)=>void) {
		debug("addListener: scope=" + scope + ";specifier=" + specifier)
		if (scope == Scope.WORKFLOW) {
			const workflowListenersMapKeys = Object.keys(this.workflowListenersMap)
			debug("workflowListenersMapKeys: " + workflowListenersMapKeys)

			const keys = specifier.split(",").map(s=>s.trim()).filter(s=>s.length>0)

			keys.map( (key) => {
				if (!workflowListenersMapKeys.includes(key)) {
					debug("initialized with callback")
					this.workflowListenersMap[Number(key)] = [callback];
				} else {
					debug("pushed callback")
					this.workflowListenersMap[Number(key)].push(callback);
				}
			})
		} else if (scope == Scope.EXECUTION) {
			debug("pushed callback")
			this.executionListeners.push(callback)
			debug("this.executionListeners.length=" + this.executionListeners.length)
		} else if (scope == Scope.INSTANCE) {
			debug("pushed callback")
			this.instanceListeners.push(callback)
			debug("this.instanceListeners.length=" + this.instanceListeners.length)
		} else if (scope == Scope.ALL) {
			debug("pushed callback")
			this.allListeners.push(callback)
			debug("this.allListeners.length=" + this.allListeners.length)
		}
	}

	removeListener(scope: Scope, specifier: string, callback: (a: IDataObject)=>void) {
		debug("removeListener: scope=" + scope + ";specifier=" + specifier)
		if (scope == Scope.WORKFLOW) {
			const workflowListenersMapKeys = Object.keys(this.workflowListenersMap)

			const keys = specifier.split(",").map(s=>s.trim()).filter(s=>s.length>0)

			keys.map( (key) => {
				if (workflowListenersMapKeys.includes(key)) {
					debug("this.workflowListenersMap["+key+'].length=' + this.workflowListenersMap[Number(key)].length)
					this.workflowListenersMap[Number(key)] = this.workflowListenersMap[Number(key)].filter(cb => cb != callback)
					debug("this.workflowListenersMap["+key+'].length=' + this.workflowListenersMap[Number(key)].length)
				}
			})
		} else if (scope == Scope.EXECUTION) {
			debug("this.executionListeners.length=" + this.executionListeners.length)
			this.executionListeners = this.executionListeners.filter(cb => cb != callback)
			debug("this.executionListeners.length=" + this.executionListeners.length)
		} else if (scope == Scope.INSTANCE) {
			debug("this.instanceListeners.length=" + this.instanceListeners.length)
			this.instanceListeners = this.instanceListeners.filter(cb => cb != callback)
			debug("this.instanceListeners.length=" + this.instanceListeners.length)
		} else if (scope == Scope.ALL) {
			debug("this.allListeners.length=" + this.allListeners.length)
			this.allListeners = this.allListeners.filter(cb => cb != callback)
			debug("this.allListeners.length=" + this.allListeners.length)
		}
	}


}
