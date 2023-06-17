import 'reflect-metadata';
import { Service } from 'typedi';
import { IDataObject } from "n8n-workflow";

// const debug = require('debug')('kv-storage')

@Service()
export class KVStorageService {

	private map: Record<string, string> = {};

	constructor() {

	}

	getAllKeys(scope: string): IDataObject {
		let map_keys = Object.keys(this.map);
		return { 'keys': map_keys };
	}

	getAllKeyValues(): IDataObject {
		return this.map;
	}

	getValue(key: string): IDataObject {
		return {'val': this.map[key]};
	}

	setValue(key: string, val: string): IDataObject {
		this.map[key] = val;
		return { 'result': "OK" };
	}


}
