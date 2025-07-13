import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HedgeExecutor } from './HedgeExecutor.node';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

const getHelpers = (mockedResponse: any): IExecuteFunctions => {
	const self = {
		getNodeParameter: vi.fn(),
		getInputData: vi.fn().mockReturnValue([{ json: {} }]),
		getCredentials: vi.fn().mockResolvedValue({ apiKey: 'test-key', apiSecret: 'test-secret' }),
		helpers: {
			returnJsonArray: vi.fn().mockImplementation((data) => data as unknown as INodeExecutionData[]),
			httpRequest: vi.fn().mockResolvedValue(mockedResponse),
		},
	};
	return self as unknown as IExecuteFunctions;
};

describe('HedgeExecutor', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		process.env.HYPERLIQUID_MCP_URL = 'https://hyperliquid-mcp.test.app';
	});

	it('should be defined', () => {
		expect(new HedgeExecutor()).toBeDefined();
	});

	it('should have a description', () => {
		const node = new HedgeExecutor();
		expect(node.description).toBeDefined();
		expect(node.description.displayName).toBe('Hedge Executor');
	});

	describe('execute', () => {
		it('should do nothing if delta is within the deadband', async () => {
			const helpers = getHelpers({});
			(helpers.getNodeParameter as vi.Mock)
				.mockReturnValueOnce(0.001) // delta
				.mockReturnValueOnce(0.004); // deadband

			const node = new HedgeExecutor();
			await node.execute.call(helpers);

			expect(helpers.helpers.httpRequest).not.toHaveBeenCalled();
		});

		it('should send a SELL order for a positive delta', async () => {
			const helpers = getHelpers({ status: 'ok' });
			(helpers.getNodeParameter as vi.Mock)
				.mockReturnValueOnce(0.5) // delta
				.mockReturnValueOnce(0.004) // deadband
				.mockReturnValueOnce('ETH-PERP'); // symbol

			const node = new HedgeExecutor();
			await node.execute.call(helpers);

			const expectedPayload = expect.objectContaining({
				side: 'SELL',
				qty: 0.5,
				symbol: 'ETH-PERP',
			});

			expect(helpers.helpers.httpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://hyperliquid-mcp.test.app/order',
				body: expectedPayload,
			}));
		});

		it('should send a BUY order for a negative delta', async () => {
			const helpers = getHelpers({ status: 'ok' });
			(helpers.getNodeParameter as vi.Mock)
				.mockReturnValueOnce(-0.5) // delta
				.mockReturnValueOnce(0.004) // deadband
				.mockReturnValueOnce('ETH-PERP'); // symbol

			const node = new HedgeExecutor();
			await node.execute.call(helpers);

			const expectedPayload = expect.objectContaining({
				side: 'BUY',
				qty: 0.5,
				symbol: 'ETH-PERP',
			});

			expect(helpers.helpers.httpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://hyperliquid-mcp.test.app/order',
				body: expectedPayload,
			}));
		});
	});
});