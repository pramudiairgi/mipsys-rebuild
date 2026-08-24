import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../src/finance/finance.service';
import { OrderPartsService } from '../src/order-parts/order-parts.service';

describe('FinanceService - generateInvoiceNumber (TDD RED)', () => {
  let service: FinanceService;
  let mockDb: any;
  let mockOrderPartsService: any;
  let counterValue: string;

  beforeEach(async () => {
    counterValue = '5';
    mockDb = {
      query: {
        invoices: { findFirst: jest.fn().mockResolvedValue(null) },
        serviceRequests: { findFirst: jest.fn().mockResolvedValue({ id: 25, ticketNumber: 'SR-20260824-0025' }) },
        financeSettings: {
          findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
            // drizzle-orm eq helper returns SQL object, we just check counterValue mock
            // Simulate: if querying counter key, return counterValue, if ppn_rate return 11
            // For test simplicity, we track calls
            // This mock will be overridden per test
            return null;
          }),
        },
      },
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
          onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
          returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(async () => {
            // Simulate increment: counterValue = String(parseInt(counterValue)+1)
            counterValue = String(parseInt(counterValue, 10) + 1);
            return undefined;
          }),
        }),
      }),
      select: jest.fn(),
    };

    mockOrderPartsService = {
      getTotalPartsCost: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: 'DB_CONNECTION', useValue: mockDb },
        { provide: OrderPartsService, useValue: mockOrderPartsService },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  it('should NOT reset counter to 0 on existing period - should increment from existing value', async () => {
    // Simulate existing counter 5 for current period, ppn 11
    // After fix, generateInvoiceNumber should increment 5 -> 6 and return INV-YYYYMM-0006
    // With bug, it resets to 0 -> 1 and returns 0001 causing duplicate
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    counterValue = '5';

    let insertCallValue: string | null = null;
    let onConflictSetValue: any = null;

    mockDb.query.financeSettings.findFirst = jest.fn().mockImplementation(async (args: any) => {
      // First call is getPpnRate (ppn_rate), second is generateInvoiceNumber read counter
      // We need to distinguish by call order
      // For this test, we call generateInvoiceNumber directly via create()
      // create() does: findFirst SR, findFirst active invoice, generateInvoiceNumber (insert, update, findFirst counter), getPpnRate
      // Let's mock to return counterValue on second findFirst
      // Use mock call count
      const callIdx = mockDb.query.financeSettings.findFirst.mock.calls.length;
      // call 1 will be after insert/update for generateInvoiceNumber
      // Actually generateInvoiceNumber does findFirst after update
      // So we return counterValue then
      return { key: `inv_counter_${period}`, value: counterValue };
    });

    // Track insert - bug is it uses onConflictDoUpdate with EXCLUDED.value = '0' which resets counter
    let usedDoNothing = false;
    let usedDoUpdate = false;
    const mockOnConflictDoUpdate = jest.fn().mockImplementation((args: any) => {
      usedDoUpdate = true;
      onConflictSetValue = args?.set?.value;
      // Simulate bug: reset counter to '0' before increment
      counterValue = '0';
      return Promise.resolve();
    });
    const mockOnConflictDoNothing = jest.fn().mockImplementation(() => {
      usedDoNothing = true;
      return Promise.resolve();
    });
    mockDb.insert = jest.fn().mockReturnValue({
      values: jest.fn().mockImplementation((vals: any) => {
        insertCallValue = vals.value;
        return {
          onConflictDoUpdate: mockOnConflictDoUpdate,
          onConflictDoNothing: mockOnConflictDoNothing,
          returning: jest.fn().mockResolvedValue([{ id: 1 }]),
        };
      }),
    });

    // Mock update to increment
    mockDb.update = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(async () => {
          counterValue = String(parseInt(counterValue, 10) + 1);
        }),
      }),
    });

    // FindFirst for SR and active invoice
    mockDb.query.serviceRequests.findFirst = jest.fn().mockResolvedValue({ id: 25, ticketNumber: 'SR-TEST-001' });
    mockDb.query.invoices.findFirst = jest.fn().mockResolvedValue(null); // no active invoice

    // Now test: the generateInvoiceNumber should be called via create()
    // We will call create and check invoiceNumber
    // Need to mock financeSettings for getPpnRate also
    let callCount = 0;
    mockDb.query.financeSettings.findFirst = jest.fn().mockImplementation(async () => {
      callCount++;
      // First findFirst after update is for generateInvoiceNumber counter read
      // Second is for getPpnRate? Actually order is generateInvoiceNumber first, then getPpnRate
      // So callCount 1 = counter read, callCount 2 = ppn_rate read
      if (callCount === 1) {
        return { key: `inv_counter_${period}`, value: counterValue };
      }
      return { key: 'ppn_rate', value: '11' };
    });

    const dto: any = {
      ticketNumber: 'SR-TEST-001',
      clientName: 'Test Client',
      serviceFee: 100000,
      partFee: 50000,
    };

    const result = await service.create(dto);

    // With correct logic (no reset), counter 5 -> 6 => INV-...-0006
    // With bug (reset to 0 -> 1) => INV-...-0001
    const expected = `INV-${period}-0006`;
    const buggy = `INV-${period}-0001`;

    console.log(`Generated: ${result.invoiceNumber}, expected ${expected}, buggy ${buggy}, usedDoNothing=${usedDoNothing}, usedDoUpdate=${usedDoUpdate}`);

    // This assertion should FAIL with bug (red) and PASS after fix (green)
    expect(result.invoiceNumber).toBe(expected);
    expect(result.invoiceNumber).not.toBe(buggy);
    // Correct implementation should use onConflictDoNothing, not onConflictDoUpdate which resets
    expect(usedDoNothing).toBe(true);
    expect(usedDoUpdate).toBe(false);

    // Also ensure we did NOT reset to '0'
    // The insert value should be '0' for new period, but onConflict should NOT overwrite existing with 0
    // We check that onConflictDoUpdate was NOT called with EXCLUDED.value, or better that it was onConflictDoNothing
    // For now, the key assertion is invoiceNumber
  });

  it('should throw BadRequest if active invoice exists', async () => {
    mockDb.query.serviceRequests.findFirst = jest.fn().mockResolvedValue({ id: 25, ticketNumber: 'SR-EXISTS' });
    mockDb.query.invoices.findFirst = jest.fn().mockResolvedValue({ id: 10, serviceRequestId: 25, voidedAt: null });

    await expect(
      service.create({ ticketNumber: 'SR-EXISTS', clientName: 'X', serviceFee: 0, partFee: 0 } as any),
    ).rejects.toThrow('Sudah ada invoice');
  });

  it('should allow re-invoice after VOID (no active invoice)', async () => {
    mockDb.query.serviceRequests.findFirst = jest.fn().mockResolvedValue({ id: 25, ticketNumber: 'SR-VOIDED' });
    // Simulate no active invoice (voidedAt not null filtered)
    mockDb.query.invoices.findFirst = jest.fn().mockResolvedValue(null);
    let counter = '1';
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    mockDb.query.financeSettings.findFirst = jest.fn().mockImplementation(async () => {
      // Return counter then ppn
      // Use simple counter increment simulation
      return { key: `inv_counter_${period}`, value: counter };
    });
    // Mock insert/update to simulate increment to 2
    mockDb.insert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
        returning: jest.fn().mockResolvedValue([{ id: 99 }]),
      }),
    });
    mockDb.update = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    });

    await expect(
      service.create({ ticketNumber: 'SR-VOIDED', clientName: 'PT Tes', serviceFee: 10000, partFee: 0 } as any),
    ).resolves.toHaveProperty('success', true);
  });
});
