import 'reflect-metadata';
import { IExecuteFunctions } from 'n8n-core';

import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { Container } from 'typedi';
import { KvStorageService, Scope } from './KvStorageService';

// @ts-ignore
const debug = require('debug')('kv-storage');

export class KvStorage implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'Key-Value Storage',
		name: 'kvStorage',
		icon: 'file:KvStorage.svg',
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
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Get Value by Key in Scope',
						value: 'getValue',
						action: 'Get value by key in scope',
					},
					{
						name: 'List All Keys in Scope',
						value: 'listAllScopeKeys',
						action: 'List all keys in scope',
					},
					{
						name: 'List All KeyValues in ALL Scopes',
						value: 'listAllKeyValuesInAllScopes',
						action: 'Get all values and keys in all scopes debug',
					},
					{
						name: 'List All KeyValues in Scope',
						value: 'listAllKeyValues',
						action: 'List all values and keys in scope',
					},
					{
						name: 'Set Value for Key in Scope',
						value: 'setValue',
						action: 'Set value for key in scope',
					},
				],
				default: 'getValue',
				noDataExpression: true,
			},

			{
				displayName: 'Scope',
				name: 'scope',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						operation: ['listAllKeyValues', 'listAllScopeKeys', 'getValue', 'setValue'],
					},
				},
				options: [
					{
						name: 'ALL Scopes',
						value: Scope.ALL,
					},
					{
						name: 'Execution Scope',
						value: Scope.EXECUTION,
					},
					{
						name: 'Workflow Scope',
						value: Scope.WORKFLOW,
					},
					{
						name: 'Instance Scope',
						value: Scope.INSTANCE,
					},
				],
				default: 'WORKFLOW',
			},

			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['getValue', 'setValue'],
					},
				},
				default: '',
				placeholder: 'my-example-key',
			},

			{
				displayName: 'Value',
				name: 'val',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['setValue'],
					},
				},
				default: '',
				placeholder: 'my-example-value',
			},

			{
				displayName: 'ExecutionId',
				name: 'executionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['listAllKeyValues', 'listAllScopeKeys', 'getValue', 'setValue'],
						scope: [Scope.EXECUTION],
					},
				},
				default: '={{ $execution.id }}',
				placeholder: '={{ $execution.ID }}',
				description: 'Do not change this - this is unique identifier of Execution',
			},
		],
	};
	// The execute method will go here

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData = [];

		const operation = this.getNodeParameter('operation', 0) as string;

		let specifier = '';
		let scope = Scope.ALL;

		try {
			const scopeVar = this.getNodeParameter('scope', 0) as keyof typeof Scope;
			scope = Scope[scopeVar];
			switch (scope) {
				case Scope.EXECUTION:
					specifier = this.getNodeParameter('executionId', 0) as string;
					break;
				case Scope.WORKFLOW:
					specifier = this.getWorkflow().id as string;
					break;
				case Scope.INSTANCE:
					specifier = 'N8N';
					break;
				default:
					break;
			}
		} catch (e) {
			//no scope provided, we are in 'listAllKeyValuesInAllScopes' option
		}

		const service = Container.get(KvStorageService);

		if (operation === 'listAllKeyValuesInAllScopes') {
			const result = service.listAllKeyValuesInAllScopes();
			returnData.push(result);
		} else if (operation === 'listAllScopeKeys') {
			const result = service.listAllKeysInScope(scope, specifier);
			returnData.push(result);
		} else if (operation === 'listAllKeyValues') {
			const result = service.listAllKeyValuesInScope(scope, specifier);
			returnData.push(result);
		} else if (operation === 'getValue') {
			const key = this.getNodeParameter('key', 0) as string;

			const result = service.getValue(key, scope, specifier);
			returnData.push(result);
		} else if (operation === 'setValue') {
			const key = this.getNodeParameter('key', 0) as string;
			const val = this.getNodeParameter('val', 0) as string;

			const result = service.setValue(key, val, scope, specifier);
			returnData.push(result);
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}