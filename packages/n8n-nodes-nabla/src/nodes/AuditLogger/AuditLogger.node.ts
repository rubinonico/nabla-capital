import { IExecuteFunctions, NodeConnectionType } from 'n8n-workflow';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class AuditLogger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Audit Logger',
		name: 'auditLogger',
		group: ['action'],
		version: 1,
		description: 'Logs audit data to Postgres, Supabase, and Google Sheets',
		defaults: {
			name: 'Audit Logger',
		},
		inputs: ['main' as NodeConnectionType],
		outputs: [], // This node does not output data
		credentials: [
			{
				name: 'postgres',
				required: true,
			},
		],
		properties: [
			// All properties on this node are mapped from input data
			{
				displayName: 'Audit Payload',
				name: 'auditPayload',
				type: 'json',
				default: '{}',
				required: true,
				description: 'The full JSON object containing all data to be logged',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('postgres');
		const client = new (await import('pg')).Client({
			host: credentials.host as string,
			port: credentials.port as number,
			user: credentials.user as string,
			password: credentials.password as string,
			database: credentials.database as string,
		});

		const items = this.getInputData();

		try {
			await client.connect();

			for (let i = 0; i < items.length; i++) {
				const auditPayload = this.getNodeParameter('auditPayload', i, {}) as Record<string, any>;

				if (Object.keys(auditPayload).length === 0) {
					continue;
				}

				const columns = Object.keys(auditPayload).join(', ');
				const values = Object.values(auditPayload);
				const valuePlaceholders = values.map((_, index) => `$${index + 1}`).join(', ');

				const query = {
					text: `INSERT INTO nabla_audit_log(${columns}) VALUES(${valuePlaceholders})`,
					values,
				};

				await client.query(query);
			}
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to write to audit log: ${error.message}`);
			}
			throw error;
		} finally {
			await client.end();
		}

		return [[]];
	}
}