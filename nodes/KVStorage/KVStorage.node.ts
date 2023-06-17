import 'reflect-metadata';
import { IExecuteFunctions } from 'n8n-core';

import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

// const debug = require('debug')('kv-storage');
// import { Container } from 'typedi';

export class KVStorage implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'Key-Value Storage',
		name: 'kvStorage',
		icon: 'file:KVStorage.svg',
		group: ['storage'],
		version: 1,
		description: 'Key-Value Storage Getter and Setter',
		defaults: {
			name: 'KVStorage',
		},

		credentials: [],
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Scope',
				name: 'scope',
				type: 'options',
				options: [
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
				default: 'instance',
				noDataExpression: true,
				required: true,
				description: 'Scope of Key-Value pair',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						scope: ['execution', 'workflow', 'instance'],
					},
				},
				options: [
					{
						name: 'List All Scope Keys',
						value: 'listAllScopeKeys',
						action: 'List all keys in Scope',
					},
					{
						name: 'Get All Values',
						value: 'getAllValues',
						action: 'Get All Values and Keys from Scope',
					},
					{
						name: 'Get Value',
						value: 'getValue',
						action: 'Get Value from Scope',
					},
					{
						name: 'Set Value',
						value: 'setValue',
						action: 'Set Storage Value in Scope',
					},
				],
				default: 'login',
				noDataExpression: true,
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['getValue', 'setValue'],
						scope: ['execution', 'workflow', 'instance'],
					},
				},
				default: '',
				placeholder: 'my-example-key',
				description: 'Key',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['setValue'],
						scope: ['execution', 'workflow', 'instance'],
					},
				},
				default: '',
				placeholder: 'my-example-value',
				description: 'Value',
			},


		]
	};
	// The execute method will go here

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData = [{'test': 'test'}];
		return [this.helpers.returnJsonArray(returnData)];
	}
}
