import { IExecuteFunctions, NodeConnectionType } from 'n8n-workflow';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class GenericLPDelta implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Generic LP Delta',
		name: 'genericLPDelta',
		group: ['transform'],
		version: 1,
		description: 'Calculates the delta of a concentrated liquidity position',
		defaults: {
			name: 'Generic LP Delta',
		},
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		properties: [
			{
				displayName: 'Chain Type',
				name: 'chainType',
				type: 'options',
				options: [
					{
						name: 'EVM',
						value: 'evm',
					},
					{
						name: 'Solana',
						value: 'solana',
					},
				],
				default: 'evm',
				description: 'The type of blockchain',
			},
			{
				displayName: 'Chain ID',
				name: 'chainId',
				type: 'string',
				default: '',
				placeholder: 'e.g., base',
				description: 'The ID of the blockchain',
				displayOptions: {
					show: {
						chainType: [
							'evm',
						],
					},
				},
			},
			{
				displayName: 'Protocol',
				name: 'protocol',
				type: 'string',
				default: '',
				placeholder: 'e.g., aerodrome',
				description: 'The DEX protocol name',
				displayOptions: {
					show: {
						chainType: [
							'evm',
						],
					},
				},
			},
			{
				displayName: 'Pool Address',
				name: 'poolAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g., 0x...',
				description: 'The address of the liquidity pool',
			},
			{
				displayName: 'Wallet Address',
				name: 'wallet',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g., 0x...',
				description: 'The wallet address holding the LP position',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const chainType = this.getNodeParameter('chainType', i, 'evm') as string;
			const poolAddress = this.getNodeParameter('poolAddress', i, '') as string;
			const wallet = this.getNodeParameter('wallet', i, '') as string;

			const baseUrl = chainType === 'solana' ? process.env.SOLANA_MCP_URL : process.env.DATAI_MCP_URL;

			if (!baseUrl) {
				throw new Error('Required MCP URL environment variable is not set.');
			}

			let fullUrl: string;

			if (chainType === 'solana') {
				// As per PRD, Solana MCP has a different structure
				// Assuming a structure like /liquidity/{poolAddress}?wallet={wallet}
				fullUrl = `${baseUrl}/liquidity/${poolAddress}?wallet=${wallet}`;
			} else {
				const chainId = this.getNodeParameter('chainId', i, '') as string;
				const protocol = this.getNodeParameter('protocol', i, '') as string;
				if (!chainId || !protocol) {
					throw new Error('Chain ID and Protocol are required for EVM chains.');
				}
				fullUrl = `${baseUrl}/${chainId}/${protocol}/lp/${poolAddress}?wallet=${wallet}`;
			}

			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: fullUrl,
				json: true,
			});

			// Assuming the MCP returns a body with { delta, liqUsd, inRange }
			const executionData = this.helpers.returnJsonArray([response]);
			returnData.push(...executionData);
		}

		return [returnData];
	}
}