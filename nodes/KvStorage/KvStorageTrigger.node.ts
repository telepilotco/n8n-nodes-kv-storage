import {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse, NodeConnectionType
} from "n8n-workflow";
import { EventType, KvStorageService, Scope } from './KvStorageService';
import { Container } from 'typedi';

const debug = require('debug')('kv-storage');

export class KvStorageTrigger implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'Key-Value Storage Trigger',
		name: 'kvStorageTrigger',
		icon: 'file:KvStorage.svg',
		group: ['trigger'],
		version: 1,
		description: 'Key-Value Storage change listener',
		defaults: {
			name: 'KVStorage Trigger',
		},
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		credentials: [],
		properties: [
			{
				displayName: 'Scope',
				name: 'scope',
				type: 'options',
				required: true,
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
				// placeholder: 'my-example-key',
			},
			{
				displayName: 'EventType',
				name: 'eventType',
				type: 'multiOptions',
				default: [EventType.ANY],
				required: true,
				options: [
					{
						name: 'ANY',
						value: EventType.ANY,
					},
					{
						name: 'Added',
						value: EventType.ADDED,
					},
					{
						name: 'Updated',
						value: EventType.UPDATED,
					},
					{
						name: 'Deleted',
						value: EventType.DELETED,
					},
				],
				description: 'Specify which operations you would like to receive',
			},
			{
				displayName: 'Specifier',
				name: 'specifier',
				type: 'string',
				default: '',
				required: true,
				placeholder: '41,42,43,102',
				displayOptions: {
					show: {
						scope: [Scope.WORKFLOW],
					},
				},
				description: 'Comma-separated list of Workflow IDs',
			},
		],
	};

	// @ts-ignore
	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const service = Container.get(KvStorageService);

		const scopeVar = this.getNodeParameter('scope', 0) as keyof typeof Scope;
		const specifier = this.getNodeParameter('specifier', 0) as string;

		const eventTypes = this.getNodeParameter('eventType', [EventType.ANY]) as string;

		const scope = Scope[scopeVar];

		const _listener = (a: IDataObject) => {
			if (eventTypes.includes(a['eventType'] as string) || eventTypes.includes(EventType.ANY)) {
				_emit(a);
			}
		};

		service.addListener(scope, specifier, _listener);

		async function closeFunction() {
			debug('closeFunction');
			service.removeListener(scope, specifier, _listener);
		}

		const _emit = (data: IDataObject) => {
			this.emit([this.helpers.returnJsonArray([data])]);
		};

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
					if (eventTypes.includes(a['eventType'] as string) || eventTypes.includes(EventType.ANY)) {
						_emit(a);

						clearTimeout(timeoutHandler);
						service.removeListener(scope, specifier, _listener2);
						resolve(true);
					}
				};
				service.addListener(scope, specifier, _listener2);
			});
		};

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
}

exports.KvStorageTrigger = KvStorageTrigger;
