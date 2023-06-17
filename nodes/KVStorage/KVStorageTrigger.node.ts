
import {
	IDataObject,
	INodeType,
	INodeTypeDescription, ITriggerFunctions, ITriggerResponse
} from "n8n-workflow";
import { KVStorageService, Scope } from "./KVStorageService";
import { Container } from "typedi";

// const debug = require('debug')('kv-storage');
// import { Container } from 'typedi';

const debug = require('debug')('kv-storage');


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
				displayName: 'Scope',
				name: 'scope',
				type: 'options',
				options: [
					{
						name: 'ALL',
						value: Scope.ALL,
					},
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
				default: Scope.WORKFLOW,
				noDataExpression: true,
				required: true,
				description: 'Scope of Key-Value pair',
			},
			{
				displayName: 'Specifier',
				name: 'specifier',
				type: 'string',
				default: '',
				required: true,
				placeholder: '41,42,43,102',
				displayOptions: {
					show:	{
							scope: [Scope.WORKFLOW]
						}
				},
				description: 'Comma-separated list of Workflow IDs.'
			},
		],
	};

	// @ts-ignore
	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const service = Container.get(KVStorageService);

		const scopeVar = this.getNodeParameter('scope', 0) as keyof typeof Scope;
		const specifier = this.getNodeParameter('specifier', 0) as string;

		const scope = Scope[scopeVar]

		// const data = {'tst': 24}
		// this.emit([this.helpers.returnJsonArray([data])]);

		const _listener = (a: IDataObject) => {
			_emit(a);
		}

		service.addListener(scope, specifier, _listener)

		async function closeFunction() {
			debug('closeFunction');
			service.removeListener(scope, specifier, _listener);
		}

		const _emit = (data: IDataObject) => {
			this.emit([this.helpers.returnJsonArray([data])]);
		}

		const manualTriggerFunction = async () => {
			await new Promise((resolve, reject) => {
				const timeoutHandler = setTimeout(() => {
					reject(
						new Error(
							'Aborted, no message received within 30secs. This 30sec timeout is only set for "manually triggered execution". Active Workflows will listen indefinitely.',
						),
					);
				}, 30000);

				const _listener2 = (a: IDataObject) => {
						_emit(a);

						clearTimeout(timeoutHandler);
						service.removeListener(scope, specifier, _listener2);
						resolve(true);
				}
				service.addListener(scope, specifier, _listener2)
			});
		};

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
}

exports.KVStorageTrigger = KVStorageTrigger;
