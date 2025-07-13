import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLogger } from './AuditLogger.node';
import { IExecuteFunctions } from 'n8n-workflow';

const mockQuery = vi.fn().mockResolvedValue(undefined);
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockEnd = vi.fn().mockResolvedValue(undefined);

vi.mock('pg', () => {
	const Client = vi.fn(() => ({
		connect: mockConnect,
		query: mockQuery,
		end: mockEnd,
	}));
	return { Client };
});

const getHelpers = (): IExecuteFunctions => {
	const self = {
		getNodeParameter: vi.fn(),
		getInputData: vi.fn().mockReturnValue([{ json: {} }]),
		getCredentials: vi.fn().mockResolvedValue({
			host: 'localhost',
			port: 5432,
			user: 'test',
			password: 'password',
			database: 'db',
		}),
	};
	return self as unknown as IExecuteFunctions;
};

describe('AuditLogger', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should be defined', () => {
		expect(new AuditLogger()).toBeDefined();
	});

	it('should have a description', () => {
		const node = new AuditLogger();
		expect(node.description).toBeDefined();
		expect(node.description.displayName).toBe('Audit Logger');
	});

	describe('execute', () => {
		it('should construct a valid INSERT query and execute it', async () => {
			const helpers = getHelpers();
			const auditPayload = {
				timestamp: '2025-07-13T20:48:00.000Z',
				delta: -0.5,
				hedgeTxHash: '0x...hash',
			};
			(helpers.getNodeParameter as vi.Mock).mockReturnValue(auditPayload);

			const node = new AuditLogger();
			await node.execute.call(helpers);

			expect(mockConnect).toHaveBeenCalled();
			const expectedQuery = 'INSERT INTO nabla_audit_log(timestamp, delta, hedgeTxHash) VALUES($1, $2, $3)';
			const expectedValues = Object.values(auditPayload);
			expect(mockQuery).toHaveBeenCalledWith({
				text: expectedQuery,
				values: expectedValues,
			});
			expect(mockEnd).toHaveBeenCalled();
		});

		it('should not query if payload is empty', async () => {
			const helpers = getHelpers();
			(helpers.getNodeParameter as vi.Mock).mockReturnValue({});

			const node = new AuditLogger();
			await node.execute.call(helpers);

			expect(mockConnect).toHaveBeenCalled();
			expect(mockQuery).not.toHaveBeenCalled();
			expect(mockEnd).toHaveBeenCalled();
		});
	});
});