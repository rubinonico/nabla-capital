import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenericLPDelta } from './GenericLPDelta.node';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

// A properly structured mock for IExecuteFunctions
const getHelpers = (mockedResponse: any): IExecuteFunctions => {
	const helpers = {
		httpRequest: vi.fn().mockResolvedValue(mockedResponse),
		returnJsonArray: vi.fn().mockImplementation((data) => data as unknown as INodeExecutionData[]),
	};
	const self = {
		getNodeParameter: vi.fn(),
		getInputData: vi.fn().mockReturnValue([{ json: {} }]),
		helpers,
	};
	return self as unknown as IExecuteFunctions;
};

describe('GenericLPDelta', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		process.env.DATAI_MCP_URL = 'https://datai-mcp.test.app';
		process.env.SOLANA_MCP_URL = 'https://solana-mcp.test.app';
	});

	it('should be defined', () => {
		expect(new GenericLPDelta()).toBeDefined();
	});

	it('should have a description', () => {
		const node = new GenericLPDelta();
		expect(node.description).toBeDefined();
		expect(node.description.displayName).toBe('Generic LP Delta');
	});

	describe('execute', () => {
		it('should construct the correct URL for EVM chains and return data', async () => {
			const mockedResponse = { delta: -0.5, liqUsd: 10000, inRange: true };
			const helpers = getHelpers(mockedResponse);

			(helpers.getNodeParameter as vi.Mock)
				.mockReturnValueOnce('evm') // chainType
				.mockReturnValueOnce('0x123') // poolAddress
				.mockReturnValueOnce('0xabc') // wallet
				.mockReturnValueOnce('base') // chainId
				.mockReturnValueOnce('aerodrome'); // protocol

			const node = new GenericLPDelta();
			const result = await node.execute.call(helpers);

			expect(helpers.helpers.httpRequest).toHaveBeenCalledWith({
				method: 'GET',
				url: 'https://datai-mcp.test.app/base/aerodrome/lp/0x123?wallet=0xabc',
				json: true,
			});
			expect(helpers.helpers.returnJsonArray).toHaveBeenCalledWith([mockedResponse]);
			expect(result).toEqual([[mockedResponse]]);
		});

		it('should construct the correct URL for Solana and return data', async () => {
			const mockedResponse = { delta: 0.2, liqUsd: 5000, inRange: false };
			const helpers = getHelpers(mockedResponse);

			(helpers.getNodeParameter as vi.Mock)
				.mockReturnValueOnce('solana') // chainType
				.mockReturnValueOnce('pool-address-sol') // poolAddress
				.mockReturnValueOnce('wallet-address-sol'); // wallet

			const node = new GenericLPDelta();
			await node.execute.call(helpers);

			expect(helpers.helpers.httpRequest).toHaveBeenCalledWith({
				method: 'GET',
				url: 'https://solana-mcp.test.app/liquidity/pool-address-sol?wallet=wallet-address-sol',
				json: true,
			});
		});

		it('should throw an error if DATAI_MCP_URL is not set for EVM', async () => {
			delete process.env.DATAI_MCP_URL;
			const helpers = getHelpers({});
			(helpers.getNodeParameter as vi.Mock).mockReturnValueOnce('evm');
			const node = new GenericLPDelta();
			await expect(node.execute.call(helpers)).rejects.toThrow('Required MCP URL environment variable is not set.');
		});
	});
});