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
		debug(scopedKey)
		return scopedKey;
	}

	private getKey(scopedKey: string): string {
		const match = scopedKey.match(/scope:\w+-.*:(.*)/)
		return  match != null ? match[1]: "EMPTY";
	}


}
