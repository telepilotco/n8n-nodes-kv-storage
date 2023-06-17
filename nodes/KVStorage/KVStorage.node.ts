import 'reflect-metadata';
import { IExecuteFunctions } from "n8n-core";

import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription
} from "n8n-workflow";
import { Container } from "typedi";
import { KVStorageService, Scope } from "./KVStorageService";

// @ts-ignore
const debug = require('debug')('kv-storage');

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
						value: Scope.EXECUTION,
					},
					{
						name: 'Workflow',
						value: Scope.WORKFLOW,
					},
					{
						name: 'Instance',
						value: Scope.INSTANCE,
					}
				],
				default: Scope.INSTANCE,
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
						scope: [Scope.EXECUTION, Scope.WORKFLOW, Scope.INSTANCE],
					},
				},
				options: [
					{
						name: 'List All KeyValues in ALL Scopes',
						value: 'listAllKeyValuesInAllScopes',
						action: 'Get All Values and Keys in ALL Scopes (Debug)',
					},
					{
						name: 'List All KeyValues in Scope',
						value: 'listAllKeyValues',
						action: 'List All Values and Keys in Scope',
					},
					{
						name: 'List All Keys in Scope',
						value: 'listAllScopeKeys',
						action: 'List all keys in Scope',
					},
					{
						name: 'Get Value by Key in Scope',
						value: 'getValue',
						action: 'Get Value by Key in Scope',
					},
					{
						name: 'Set Value for Key in Scope',
						value: 'setValue',
						action: 'Set Value for Key in Scope',
					},
				],
				default: 'getValue',
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
						scope: [Scope.EXECUTION, Scope.WORKFLOW, Scope.INSTANCE],
					},
				},
				default: '',
				placeholder: 'my-example-key',
				description: 'Key',
			},

			{
				displayName: 'Value',
				name: 'val',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['setValue'],
						scope: [Scope.EXECUTION, Scope.WORKFLOW, Scope.INSTANCE],
					},
				},
				default: '',
				placeholder: 'my-example-value',
				description: 'Value',
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
				placeholder: '={{ $execution.id }}',
				description: 'Do not change this - this is unique identifier of Execution',
			},


		]
	};
	// The execute method will go here

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData = [];

		const scopeVar = this.getNodeParameter('scope', 0) as keyof typeof Scope;
		const operation = this.getNodeParameter('operation', 0) as string;

		const scope = Scope[scopeVar];
		let specifier = '';

		switch (scope) {
			case Scope.EXECUTION:
				specifier = this.getNodeParameter('executionId', 0) as string;
				break;
			case Scope.WORKFLOW:
				specifier = this.getWorkflow().id as string;
				break;
			case Scope.INSTANCE:
				specifier = "N8N";
				break;
		}

		const service = Container.get(KVStorageService);

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
this.getWorkflow().id;
		return [this.helpers.returnJsonArray(returnData)];
	}
}
