import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { customers } from '../../database/schema';
import { DrizzleTx } from '../../database/types';

@Injectable()
export class ServiceRequestCustomerResolver {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async resolveCustomerId(
    tx: DrizzleTx,
    customerName: string,
    address?: string,
    phone?: string,
    customerType?: string
  ): Promise<number> {
    const [existing] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.name, customerName))
      .limit(1);

    if (existing) return existing.id;

    const [{ id }] = await tx
      .insert(customers)
      .values({
        name: customerName.trim(),
        address: address?.trim(),
        phone: phone?.trim(),
        customerType,
      })
      .returning({ id: customers.id });
    return id;
  }

  async updateCustomer(
    tx: DrizzleTx,
    customerId: number,
    data: {
      name?: string;
      address?: string;
      phone?: string;
      customerType?: string;
    }
  ) {
    await tx
      .update(customers)
      .set({
        name: data.name?.trim(),
        address: data.address?.trim(),
        phone: data.phone?.trim(),
        customerType: data.customerType,
      })
      .where(eq(customers.id, customerId));
  }
}
