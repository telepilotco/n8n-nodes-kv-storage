import 'reflect-metadata';
import type { IExecuteFunctions } from 'n8n-workflow';

import { INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from "n8n-workflow";
import { Container } from 'typedi';
import { KvStorageService, Scope } from './KvStorageService';

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
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Main],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
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
						name: 'Increment Value by Key in Scope. Create Key if It Does Not Exist',
						value: 'incrementValue',
						action: 'Increment value by key in scope create key if it does not exist',
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
						operation: [
							'listAllKeyValues',
							'listAllScopeKeys',
							'getValue',
							'setValue',
							'incrementValue',
						],
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
						operation: ['getValue', 'setValue', 'incrementValue'],
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
			{
				displayName: 'Expire',
				name: 'expire',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['setValue', 'incrementValue'],
					},
				},
				default: true,
				description: 'Whether to set a timeout on key',
			},
			{
				displayName: 'TTL',
				name: 'ttl',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['setValue', 'incrementValue'],
						expire: [true],
					},
				},
				default: 60,
				description: 'Number of seconds before key expiration',
			},
		],
	};
	// The execute method will go here

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData = [];

		const service = Container.get(KvStorageService);

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			let specifier = '';
			let scope = Scope.ALL;

			try {
				const scopeVar = this.getNodeParameter('scope', itemIndex) as keyof typeof Scope;
				scope = Scope[scopeVar];
				switch (scope) {
					case Scope.EXECUTION:
						specifier = this.getNodeParameter('executionId', itemIndex) as string;
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
				const key = this.getNodeParameter('key', itemIndex) as string;

				const result = service.getValue(key, scope, specifier);
				returnData.push(result);
			} else if (operation === 'setValue') {
				const key = this.getNodeParameter('key', itemIndex) as string;
				const val = this.getNodeParameter('val', itemIndex) as string;
				const ttl = this.getNodeParameter('ttl', itemIndex, -1) as number;

				const result = service.setValue(key, val, scope, specifier, ttl);
				returnData.push(result);
			} else if (operation === 'incrementValue') {
				const key = this.getNodeParameter('key', itemIndex) as string;
				const ttl = this.getNodeParameter('ttl', itemIndex, -1) as number;

				const result = service.incrementValue(key, scope, specifier, ttl);
				returnData.push(result);
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
