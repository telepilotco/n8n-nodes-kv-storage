
import {
	INodeType,
	INodeTypeDescription, ITriggerFunctions, ITriggerResponse,
} from 'n8n-workflow';

// const debug = require('debug')('kv-storage');
// import { Container } from 'typedi';


export class KVStorageTrigger implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'Key-Value Storage Trigger',
		name: 'kvStorageTrigger',
		icon: 'file:KVStorage.svg',
		group: ['trigger'],
		version: 1,
		description: 'Key-Value Storage change listener',
		defaults: {
			name: 'KVStorage Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [],
		properties: [
			{
				displayName: 'Scopes',
				name: 'scopes',
				type: 'multiOptions',
				options: [
					{
						name: '*',
						value: '*',
					},
					{
						name: 'Execution',
						value: 'execution',
					},
					{
						name: 'Workflow',
						value: 'workflow',
					},
					{
						name: 'Instance',
						value: 'instance',
					}
				],
				default: ['*'],
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				placeholder: 'key'
			},
		],
	};

	// @ts-ignore
	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {

	}
}

exports.KVStorageTrigger = KVStorageTrigger;
