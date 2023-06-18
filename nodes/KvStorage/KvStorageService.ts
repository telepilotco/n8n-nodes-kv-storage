import 'reflect-metadata';
import { Service } from 'typedi';
import { IDataObject } from 'n8n-workflow';

const debug = require('debug')('kv-storage');

export enum Scope {
	ALL = 'ALL',
	EXECUTION = 'EXECUTION',
	WORKFLOW = 'WORKFLOW',
	INSTANCE = 'INSTANCE',
}

@Service()
export class KvStorageService {
	private map: Record<string, string> = {};

	private workflowListenersMap: Record<number, Array<(a: IDataObject) => void>> = {};
	private instanceListeners: Array<(a: IDataObject) => void> = [];
	private executionListeners: Array<(a: IDataObject) => void> = [];

	private allListeners: Array<(a: IDataObject) => void> = [];

	constructor() {}

	listAllKeyValuesInAllScopes(): IDataObject {
		debug('listAllKeyValuesInAllScopes: ');
		const mapKeys = Object.keys(this.map);
		const regExp = /scope:(\w+)-(.+):(.*)/;

		const matchedEntries: IDataObject = {};
		mapKeys
			.filter((scopedKey) => scopedKey.match(regExp))
			.map((scopedKey) => {
				const m = scopedKey.match(regExp);
				//@ts-ignore
				const scope = m[1];
				//@ts-ignore
				const specifier = m[2];
				//@ts-ignore
				const key = m[3];

				const entryKey = `${scope}-${specifier}`;

				if (Object.keys(matchedEntries).includes(entryKey)) {
					//@ts-ignore
					matchedEntries[entryKey].entries[key] = this.map[scopedKey];
				} else {
					matchedEntries[entryKey] = {
						scope,
						specifier,
						entries: { [key]: this.map[scopedKey] } as IDataObject,
					} as IDataObject;
				}
			});
		return matchedEntries;
	}

	listAllKeysInScope(scope: Scope, specifier = ''): IDataObject {
		debug('getAllKeysInScope: scope=' + scope + ';specifier=' + specifier);
		const mapKeys = Object.keys(this.map);
		const regExp = new RegExp(`scope\\:${scope}-${specifier}\\:.*`, 'g');

		const matchedKeys = mapKeys
			.filter((scopedKey) => scopedKey.match(regExp))
			.map((scopedKey) => this.getKey(scopedKey));
		return { keys: matchedKeys, scope, specifier };
	}

	listAllKeyValuesInScope(scope: Scope, specifier = ''): IDataObject {
		debug('getAllKeyValuesInScope: scope=' + scope + ';specifier=' + specifier);
		const regExp = new RegExp(`scope\\:${scope}-${specifier}\\:.*`, 'g');
		const mapKeys = Object.keys(this.map);

		const matchedKeys = mapKeys.filter((k) => k.match(regExp));
		const matchedEntries: IDataObject = {};

		matchedKeys.map((sK) => {
			const k = this.getKey(sK);
			matchedEntries[k] = this.map[sK];
		});

		return { entries: matchedEntries, scope, specifier };
	}

	getValue(key: string, scope: Scope, specifier = ''): IDataObject {
		debug('getValue: key=' + key + ';scope=' + scope + ';specifier=' + specifier);
		const scopedKey = this.composeScopeKey(key, scope, specifier);
		return { val: this.map[scopedKey] };
	}

	setValue(key: string, val: string, scope: Scope, specifier = ''): IDataObject {
		debug('setValue: key=' + key + ';val=' + val + ';scope=' + scope + ';specifier=' + specifier);
		const scopedKey = this.composeScopeKey(key, scope, specifier);
		this.map[scopedKey] = val;

		const timestamp = Date.now();
		const event = {
			scope,
			specifier,
			key,
			val,
			timestamp,
		};

		if (this.allListeners.length > 0) {
			this.allListeners.map((callback) => callback(event));
		}

		if (scope === Scope.INSTANCE && this.instanceListeners.length > 0) {
			this.instanceListeners.map((callback) => callback(event));
		}

		if (scope === Scope.EXECUTION && this.executionListeners.length > 0) {
			this.executionListeners.map((callback) => callback(event));
		}
		if (scope === Scope.WORKFLOW) {
			Object.keys(this.workflowListenersMap).map((k) => {
				if (specifier === k) {
					this.workflowListenersMap[Number(k)].map((callback) => callback(event));
				}
			});
		}

		return { result: 'OK' };
	}

	private composeScopeKey(key: string, scope: Scope, specifier = ''): string {
		debug('composeScopeKey: key=' + key + ';scope=' + scope + ';specifier=' + specifier);
		if (scope === Scope.EXECUTION) {
			return `scope:${scope}-${specifier}:${key}`;
		} else if (scope === Scope.WORKFLOW) {
			return `scope:${scope}-${specifier}:${key}`;
		} else if (scope === Scope.INSTANCE) {
			// specifier =
			return `scope:${scope}-${specifier}:${key}`;
		}
		const scopedKey = `scope:${scope}:${key}`;
		debug('scopedKey=' + scopedKey);
		return scopedKey;
	}

	private getKey(scopedKey: string): string {
		const match = scopedKey.match(/scope:\w+-.*:(.*)/);
		return match !== null ? match[1] : 'EMPTY';
	}

	addListener(scope: Scope, specifier: string, callback: (a: IDataObject) => void) {
		debug('addListener: scope=' + scope + ';specifier=' + specifier);
		if (scope === Scope.WORKFLOW) {
			const workflowListenersMapKeys = Object.keys(this.workflowListenersMap);
			debug('workflowListenersMapKeys: ' + workflowListenersMapKeys);

			const keys = specifier
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s.length > 0);

			keys.map((key) => {
				if (!workflowListenersMapKeys.includes(key)) {
					debug('initialized with callback');
					this.workflowListenersMap[Number(key)] = [callback];
				} else {
					debug('pushed callback');
					this.workflowListenersMap[Number(key)].push(callback);
				}
			});
		} else if (scope === Scope.EXECUTION) {
			debug('pushed callback');
			this.executionListeners.push(callback);
			debug('this.executionListeners.length=' + this.executionListeners.length);
		} else if (scope === Scope.INSTANCE) {
			debug('pushed callback');
			this.instanceListeners.push(callback);
			debug('this.instanceListeners.length=' + this.instanceListeners.length);
		} else if (scope === Scope.ALL) {
			debug('pushed callback');
			this.allListeners.push(callback);
			debug('this.allListeners.length=' + this.allListeners.length);
		}
	}

	removeListener(scope: Scope, specifier: string, callback: (a: IDataObject) => void) {
		debug('removeListener: scope=' + scope + ';specifier=' + specifier);
		if (scope === Scope.WORKFLOW) {
			const workflowListenersMapKeys = Object.keys(this.workflowListenersMap);

			const keys = specifier
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s.length > 0);

			keys.map((key) => {
				if (workflowListenersMapKeys.includes(key)) {
					debug(
						'this.workflowListenersMap[' +
							key +
							'].length=' +
							this.workflowListenersMap[Number(key)].length,
					);
					this.workflowListenersMap[Number(key)] = this.workflowListenersMap[Number(key)].filter(
						(cb) => cb !== callback,
					);
					debug(
						'this.workflowListenersMap[' +
							key +
							'].length=' +
							this.workflowListenersMap[Number(key)].length,
					);
				}
			});
		} else if (scope === Scope.EXECUTION) {
			debug('this.executionListeners.length=' + this.executionListeners.length);
			this.executionListeners = this.executionListeners.filter((cb) => cb !== callback);
			debug('this.executionListeners.length=' + this.executionListeners.length);
		} else if (scope === Scope.INSTANCE) {
			debug('this.instanceListeners.length=' + this.instanceListeners.length);
			this.instanceListeners = this.instanceListeners.filter((cb) => cb !== callback);
			debug('this.instanceListeners.length=' + this.instanceListeners.length);
		} else if (scope === Scope.ALL) {
			debug('this.allListeners.length=' + this.allListeners.length);
			this.allListeners = this.allListeners.filter((cb) => cb !== callback);
			debug('this.allListeners.length=' + this.allListeners.length);
		}
	}
}