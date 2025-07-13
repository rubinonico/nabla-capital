import { IExecuteFunctions, NodeConnectionType } from 'n8n-workflow';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class HedgeExecutor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hedge Executor',
		name: 'hedgeExecutor',
		group: ['action'],
		version: 1,
		description: 'Executes a hedge order on Hyperliquid',
		defaults: {
			name: 'Hedge Executor',
		},
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		credentials: [
			{
				name: 'hyperliquidApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Delta',
				name: 'delta',
				type: 'number',
				required: true,
				default: 0,
				description: 'The delta value of the LP position',
			},
			{
				displayName: 'Hedge Symbol',
				name: 'symbol',
				type: 'string',
				required: true,
				default: 'ETH-PERP',
				description: 'The symbol of the perpetual contract to trade',
			},
			{
				displayName: 'Deadband',
				name: 'deadband',
				type: 'number',
				default: 0.004,
				description: 'The delta threshold to trigger a hedge',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const delta = this.getNodeParameter('delta', i, 0) as number;
			const deadband = this.getNodeParameter('deadband', i, 0.004) as number;
			const symbol = this.getNodeParameter('symbol', i, '') as string;

			if (Math.abs(delta) <= deadband) {
				// Delta is within the deadband, no hedge needed
				const executionData = this.helpers.returnJsonArray([{ status: 'skipped', reason: 'Delta within deadband' }]);
				returnData.push(...executionData);
				continue;
			}

			const credentials = await this.getCredentials('hyperliquidApi');
			const baseUrl = process.env.HYPERLIQUID_MCP_URL;

			if (!baseUrl) {
				throw new Error('HYPERLIQUID_MCP_URL environment variable is not set.');
			}
			if (!credentials) {
				throw new Error('Hyperliquid API credentials are not set.');
			}

			const side = delta > 0 ? 'SELL' : 'BUY';
			const qty = Math.abs(delta); // Assuming delta is in the base currency of the perp

			const orderPayload = {
				symbol,
				side,
				qty,
				clientId: `nabla-hedge-bot-${Date.now()}`,
				subAccount: 'hedge-bot', // As per PRD
			};

			const response = await this.helpers.httpRequest({
				method: 'POST',
				url: `${baseUrl}/order`,
				body: orderPayload,
				headers: {
					// The MCP will use the credentials to sign the request
					'X-API-KEY': credentials.apiKey as string,
					'X-API-SECRET': credentials.apiSecret as string,
				},
				json: true,
			});

			const executionData = this.helpers.returnJsonArray([response]);
			returnData.push(...executionData);
		}

		return [returnData];
	}
}