import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import * as schema from '../schema';
import 'dotenv/config';

async function runSeeder() {
  console.log('⏳ [Seeder]: Menyiapkan data tes untuk Service Center Epson...');

  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'db_mipsys',
    port: Number(process.env.DB_PORT) || 5433,
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('🌱 [Seeder]: Mulai menyuntikkan data tes...\n');

    // ========================================================================
    // TAHAP 1: STAFF
    // ========================================================================
    console.log('📦 Tahap 1: Staff...');
    await db.insert(schema.staff).values([
      { name: 'Administrator', role: 'ADMIN' },
      { name: 'Teknisi Budi', role: 'TECHNICIAN' },
      { name: 'Teknisi Andi', role: 'TECHNICIAN' },
    ]);
    console.log('  ✔ 3 staff dibuat');

    // ========================================================================
    // TAHAP 1B: USERS
    // ========================================================================
    console.log('📦 Tahap 1B: Users...');
    const defaultPassword = await bcrypt.hash('admin123', 10);
    await db.insert(schema.users).values([
      {
        username: 'admin',
        password: defaultPassword,
        role: 'ADMIN',
        staffId: 1,
      },
      {
        username: 'budi',
        password: defaultPassword,
        role: 'TECHNICIAN',
        staffId: 2,
      },
      {
        username: 'andi',
        password: defaultPassword,
        role: 'TECHNICIAN',
        staffId: 3,
      },
    ]);
    console.log(
      '  ✔ 3 users dibuat (admin:admin123 / budi:admin123 / andi:admin123)'
    );

    // ========================================================================
    // TAHAP 2: CUSTOMERS
    // ========================================================================
    console.log('📦 Tahap 2: Customers...');
    await db.insert(schema.customers).values([
      {
        name: 'PT. Epson Indonesia',
        phone: '02157940000',
        address: 'Jl. Buncit Raya Kav. 110, Jakarta Selatan',
        customerType: 'CORPORATE',
      },
      {
        name: 'PT. Digital Printing Solutions',
        phone: '0215556789',
        address: 'Jl. Gatot Subroto Kav. 56, Jakarta Pusat',
        customerType: 'CORPORATE',
      },
      {
        name: 'CV. Karya Mandiri',
        phone: '0315567890',
        address: 'Jl. Raya Darmo No. 45, Surabaya',
        customerType: 'CORPORATE',
      },
      {
        name: 'Toko Komputer Megah',
        phone: '0225561234',
        address: 'Jl. Asia Afrika No. 12, Bandung',
        customerType: 'CORPORATE',
      },
      {
        name: 'SDN Merdeka 01',
        phone: '0215567890',
        address: 'Jl. Merdeka No. 1, Jakarta Timur',
        customerType: 'CORPORATE',
      },
      {
        name: 'Siti Rahayu',
        phone: '081234567890',
        address: 'Jl. Sudirman No. 25, Jakarta',
        customerType: 'PERSONAL',
      },
      {
        name: 'Ahmad Fauzi',
        phone: '085678901234',
        address: 'Jl. Diponegoro No. 88, Bandung',
        customerType: 'PERSONAL',
      },
    ]);
    console.log('  ✔ 7 customers dibuat (5 Corporate, 2 Personal)');

    // ========================================================================
    // TAHAP 3: PRODUCTS (Epson Printers)
    // ========================================================================
    console.log('📦 Tahap 3: Products...');
    await db.insert(schema.products).values([
      { modelName: 'Epson L3210', serialNumber: 'EPS-L3210-001-2026' },
      { modelName: 'Epson L3110', serialNumber: 'EPS-L3110-002-2026' },
      { modelName: 'Epson L8050', serialNumber: 'EPS-L8050-003-2026' },
      { modelName: 'Epson L15150', serialNumber: 'EPS-L15150-004-2026' },
      { modelName: 'Epson M2110', serialNumber: 'EPS-M2110-005-2026' },
      { modelName: 'Epson LQ-2190', serialNumber: 'EPS-LQ2190-006-2026' },
      { modelName: 'Epson LX-310', serialNumber: 'EPS-LX310-007-2026' },
      { modelName: 'Epson TM-U220B', serialNumber: 'EPS-TMU220-008-2026' },
      {
        modelName: 'Epson SureColor P907',
        serialNumber: 'EPS-SCP907-009-2026',
      },
      {
        modelName: 'Epson WorkForce Pro WF-C579R',
        serialNumber: 'EPS-WFC579-010-2026',
      },
    ]);
    console.log('  ✔ 10 products dibuat');

    // ========================================================================
    // TAHAP 4: SPARE PARTS (Epson)
    // ========================================================================
    console.log('📦 Tahap 4: Spare Parts...');
    await db.insert(schema.spareParts).values([
      {
        partCode: 'PW-L3210',
        partName: 'Print Head Assembly (PW Head)',
        modelName: 'L3210',
        block: 'Print Head',
        stock: 8,
        minStock: 5,
        location: 'Rak A-01',
        price: '750000.00',
        type: 'ELECTRONIC',
        ipStatus: 'IP',
      },
      {
        partCode: 'MB-L3110',
        partName: 'Main Board Assy (Logic Board)',
        modelName: 'L3110',
        block: 'Main Board',
        stock: 3,
        minStock: 5,
        location: 'Rak A-02',
        price: '450000.00',
        type: 'ELECTRONIC',
        ipStatus: 'IP',
      },
      {
        partCode: 'PSU-L3210',
        partName: 'Power Supply Unit',
        modelName: 'L3210',
        block: 'PSU',
        stock: 6,
        minStock: 5,
        location: 'Rak A-03',
        price: '325000.00',
        type: 'ELECTRONIC',
        ipStatus: 'IP',
      },
      {
        partCode: 'DMP-L8050',
        partName: 'Damper (Ink Absorber)',
        modelName: 'L8050',
        block: 'Ink System',
        stock: 12,
        minStock: 10,
        location: 'Rak B-01',
        price: '85000.00',
        type: 'MECHANICAL',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'CRM-L3110',
        partName: 'CR Motor (Carriage Motor)',
        modelName: 'L3110',
        block: 'Motor',
        stock: 4,
        minStock: 5,
        location: 'Rak B-02',
        price: '275000.00',
        type: 'MOTOR',
        ipStatus: 'IP',
      },
      {
        partCode: 'PFM-LQ2190',
        partName: 'PF Motor (Paper Feed Motor)',
        modelName: 'LQ-2190',
        block: 'Motor',
        stock: 2,
        minStock: 5,
        location: 'Rak B-03',
        price: '385000.00',
        type: 'MOTOR',
        ipStatus: 'IP',
      },
      {
        partCode: 'BELT-L3110',
        partName: 'Timing Belt (CR Belt)',
        modelName: 'L3110',
        block: 'Belt',
        stock: 15,
        minStock: 10,
        location: 'Rak C-01',
        price: '65000.00',
        type: 'MECHANICAL',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'ENC-L8050',
        partName: 'Encoder Strip (Linear Scale)',
        modelName: 'L8050',
        block: 'Sensor',
        stock: 7,
        minStock: 10,
        location: 'Rak C-02',
        price: '45000.00',
        type: 'SENSOR',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'PUR-LX310',
        partName: 'Pickup Roller Assy',
        modelName: 'LX-310',
        block: 'Roller',
        stock: 0,
        minStock: 10,
        location: 'Rak D-01',
        price: '95000.00',
        type: 'MECHANICAL',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'PES-L3110',
        partName: 'PE Sensor (Paper Exit Sensor)',
        modelName: 'L3110',
        block: 'Sensor',
        stock: 20,
        minStock: 10,
        location: 'Rak D-02',
        price: '25000.00',
        type: 'SENSOR',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'WIP-ALL',
        partName: 'Waste Ink Pad / Maintenance Tank',
        modelName: 'ALL',
        block: 'Ink System',
        stock: 25,
        minStock: 20,
        location: 'Rak E-01',
        price: '55000.00',
        type: 'CONSUMABLE',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'PNL-TMU220',
        partName: 'Panel Board Assy',
        modelName: 'TM-U220B',
        block: 'Panel',
        stock: 0,
        minStock: 5,
        location: 'Rak E-02',
        price: '280000.00',
        type: 'ELECTRONIC',
        ipStatus: 'IP',
      },
      {
        partCode: 'PLT-LQ2190',
        partName: 'Platen Plate',
        modelName: 'LQ-2190',
        block: 'Platen',
        stock: 2,
        minStock: 5,
        location: 'Rak F-01',
        price: '175000.00',
        type: 'MECHANICAL',
        ipStatus: 'Non IP',
      },
      {
        partCode: 'GR-LX310',
        partName: 'Gear Assembly (Change Lever)',
        modelName: 'LX-310',
        block: 'Gear',
        stock: 1,
        minStock: 5,
        location: 'Rak F-02',
        price: '125000.00',
        type: 'MECHANICAL',
        ipStatus: 'Non IP',
      },
    ]);
    console.log('  ✔ 14 spare parts dibuat');

    // ========================================================================
    // TAHAP 5: SERVICE REQUESTS
    // ========================================================================
    console.log('📦 Tahap 5: Service Requests...');
    await db.insert(schema.serviceRequests).values([
      {
        ticketNumber: 'SR-20260501-0001',
        serviceType: 'WARRANTY',
        customerId: 1,
        productId: 1,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: '2026-05-01',
        problemDescription:
          'Printer tidak mau nge-print, lampu power nyala tapi tidak ada respon',
        statusService: 'WAITING_CHECK',
        serviceFee: '0.00',
        partFee: '0.00',
      },
      {
        ticketNumber: 'SR-20260502-0002',
        serviceType: 'NON_WARRANTY',
        customerId: 6,
        productId: 2,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: '2026-05-02',
        problemDescription:
          'Hasil print bergaris-garis vertikal, sudah cleaning head tetap sama',
        statusService: 'WAITING_CHECK',
        serviceFee: '0.00',
        partFee: '0.00',
      },
      {
        ticketNumber: 'SR-20260503-0003',
        serviceType: 'NON_WARRANTY',
        customerId: 2,
        productId: 3,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: '2026-05-03',
        checkDate: '2026-05-04',
        problemDescription:
          'Warna magenta tidak keluar sama sekali, print head diduga clogging',
        statusService: 'CHECK',
        serviceFee: '0.00',
        partFee: '0.00',
      },
      {
        ticketNumber: 'SR-20260504-0004',
        serviceType: 'NON_WARRANTY',
        customerId: 3,
        productId: 6,
        adminId: 1,
        technicianCheckId: 3,
        incomingDate: '2026-05-04',
        checkDate: '2026-05-05',
        problemDescription:
          'Dot matrix bunyi berisik, carriage macet di posisi tengah',
        statusService: 'CHECK',
        serviceFee: '0.00',
        partFee: '0.00',
      },
      {
        ticketNumber: 'SR-20260505-0005',
        serviceType: 'NON_WARRANTY',
        customerId: 4,
        productId: 8,
        adminId: 1,
        technicianCheckId: 3,
        incomingDate: '2026-05-05',
        checkDate: '2026-05-06',
        spDate: '2026-05-07',
        problemDescription:
          'Panel POS printer tidak menyala, power supply diduga rusak',
        statusService: 'AWAITING_PARTS',
        serviceFee: '0.00',
        partFee: '280000.00',
      },
      {
        ticketNumber: 'SR-20260506-0006',
        serviceType: 'NON_WARRANTY',
        customerId: 7,
        productId: 5,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: '2026-05-06',
        checkDate: '2026-05-07',
        spDate: '2026-05-08',
        approveDate: '2026-05-09',
        problemDescription:
          'M2110 tidak bisa isi ulang tinta, error ink pad full',
        statusService: 'WAITING_APPROVE',
        serviceFee: '150000.00',
        partFee: '55000.00',
      },
      {
        ticketNumber: 'SR-20260508-0007',
        serviceType: 'NON_WARRANTY',
        customerId: 5,
        productId: 7,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: '2026-05-08',
        checkDate: '2026-05-09',
        spDate: '2026-05-10',
        approveDate: '2026-05-11',
        problemDescription: 'LX-310 paper jam terus, roller sudah aus',
        statusService: 'SERVICE',
        serviceFee: '200000.00',
        partFee: '95000.00',
      },
      {
        ticketNumber: 'SR-20260509-0008',
        serviceType: 'NON_WARRANTY',
        customerId: 1,
        productId: 4,
        adminId: 1,
        technicianCheckId: 3,
        incomingDate: '2026-05-09',
        checkDate: '2026-05-10',
        spDate: '2026-05-11',
        approveDate: '2026-05-12',
        readyDate: '2026-05-13',
        problemDescription:
          'L15150 error code 0xF3, carriage motor tidak berfungsi',
        statusService: 'SERVICE',
        serviceFee: '250000.00',
        partFee: '275000.00',
      },
      {
        ticketNumber: 'SR-20260510-0009',
        serviceType: 'WARRANTY',
        customerId: 1,
        productId: 9,
        adminId: 1,
        technicianCheckId: 2,
        incomingDate: '2026-05-10',
        checkDate: '2026-05-11',
        spDate: '2026-05-12',
        approveDate: '2026-05-12',
        readyDate: '2026-05-13',
        closeDate: '2026-05-14',
        problemDescription:
          'SureColor P907 error "Service Required" waste ink pad full',
        statusService: 'DONE',
        serviceFee: '0.00',
        partFee: '0.00',
      },
      {
        ticketNumber: 'SR-20260512-0010',
        serviceType: 'WARRANTY',
        customerId: 2,
        productId: 10,
        adminId: 1,
        technicianCheckId: 3,
        incomingDate: '2026-05-12',
        checkDate: '2026-05-13',
        problemDescription:
          'WF-C579R tidak terdeteksi di jaringan, WiFi module diduga error',
        statusService: 'CANCEL',
        closeDate: '2026-05-14',
        serviceFee: '0.00',
        partFee: '0.00',
      },
    ]);
    console.log('  ✔ 10 service requests dibuat');
    console.log('     - WAITING_CHECK: 2');
    console.log('     - CHECK: 2');
    console.log('     - AWAITING_PARTS: 1');
    console.log('     - WAITING_APPROVE: 1');
    console.log('     - SERVICE: 2');
    console.log('     - DONE: 1');
    console.log('     - CANCEL: 1');

    // ========================================================================
    // TAHAP 6: ORDER PARTS
    // ========================================================================
    console.log('📦 Tahap 6: Order Parts...');
    await db.insert(schema.orderParts).values([
      {
        serviceRequestId: 5,
        sparePartId: 12,
        partName: 'Panel Board Assy',
        quantity: 1,
        priceAtAction: '280000.00',
        status: 'OUT_OF_STOCK',
      },
      {
        serviceRequestId: 6,
        sparePartId: 11,
        partName: 'Waste Ink Pad / Maintenance Tank',
        quantity: 1,
        priceAtAction: '55000.00',
        status: 'IN_STOCK',
      },
      {
        serviceRequestId: 7,
        sparePartId: 9,
        partName: 'Pickup Roller Assy',
        quantity: 1,
        priceAtAction: '95000.00',
        status: 'OUT_OF_STOCK',
      },
      {
        serviceRequestId: 8,
        sparePartId: 5,
        partName: 'CR Motor (Carriage Motor)',
        quantity: 1,
        priceAtAction: '275000.00',
        status: 'IN_STOCK',
      },
    ]);
    console.log('  ✔ 4 order parts dibuat');

    // ========================================================================
    // TAHAP 7: SERVICE LOGS
    // ========================================================================
    console.log('📦 Tahap 7: Service Logs...');
    await db.insert(schema.serviceLogs).values([
      {
        serviceRequestId: 3,
        action: 'TICKET_CREATED',
        description: 'Tiket SR-20260503-0003 dibuat oleh Administrator',
        performedBy: 1,
        createdAt: new Date('2026-05-03T09:00:00'),
      },
      {
        serviceRequestId: 3,
        action: 'ASSIGNED_TO_TECHNICIAN',
        description: 'Ditugaskan ke Teknisi Budi untuk pengecekan',
        performedBy: 1,
        createdAt: new Date('2026-05-03T09:05:00'),
      },
      {
        serviceRequestId: 3,
        action: 'DIAGNOSIS_COMPLETED',
        description:
          'Diagnosa: Print head clogging pada channel magenta, perlu replacement',
        performedBy: 2,
        createdAt: new Date('2026-05-04T14:00:00'),
      },
      {
        serviceRequestId: 8,
        action: 'TICKET_CREATED',
        description: 'Tiket SR-20260509-0008 dibuat oleh Administrator',
        performedBy: 1,
        createdAt: new Date('2026-05-09T10:00:00'),
      },
      {
        serviceRequestId: 8,
        action: 'DIAGNOSIS_COMPLETED',
        description: 'Diagnosa: CR Motor rusak, resistansi tidak sesuai spek',
        performedBy: 3,
        createdAt: new Date('2026-05-10T11:00:00'),
      },
      {
        serviceRequestId: 8,
        action: 'PART_REPLACED',
        description: 'CR Motor diganti baru, carriage bergerak normal',
        performedBy: 3,
        createdAt: new Date('2026-05-12T15:00:00'),
      },
      {
        serviceRequestId: 8,
        action: 'SERVICE_COMPLETED',
        description: 'Test print berhasil, semua fungsi normal',
        performedBy: 3,
        createdAt: new Date('2026-05-13T10:00:00'),
      },
      {
        serviceRequestId: 9,
        action: 'TICKET_CREATED',
        description: 'Tiket SR-20260510-0009 dibuat',
        performedBy: 1,
        createdAt: new Date('2026-05-10T09:00:00'),
      },
      {
        serviceRequestId: 9,
        action: 'SERVICE_COMPLETED',
        description: 'Waste ink pad diganti, reset counter, test print OK',
        performedBy: 2,
        createdAt: new Date('2026-05-13T16:00:00'),
      },
      {
        serviceRequestId: 10,
        action: 'TICKET_CANCELLED',
        description:
          'Tiket dibatalkan: Customer menggunakan garansi di tempat beli',
        performedBy: 1,
        createdAt: new Date('2026-05-14T10:00:00'),
      },
    ]);
    console.log('  ✔ 10 service logs dibuat');

    // ========================================================================
    // TAHAP 8: PURCHASE ORDERS
    // ========================================================================
    console.log('📦 Tahap 8: Purchase Orders...');
    await db.insert(schema.purchaseOrders).values({
      poNumber: 'PO-20260514-0001',
      supplierName: 'EPSON',
      status: 'REQUESTED',
      requestedBy: 1,
      notes: 'Restock panel board dan pickup roller',
      totalAmount: '655000.00',
    });
    await db.insert(schema.poItems).values([
      {
        purchaseOrderId: 1,
        sparePartId: 12,
        quantity: 2,
        unitPrice: '280000.00',
        receivedQty: 0,
        subtotal: '560000.00',
      },
      {
        purchaseOrderId: 1,
        sparePartId: 9,
        quantity: 1,
        unitPrice: '95000.00',
        receivedQty: 0,
        subtotal: '95000.00',
      },
    ]);
    console.log('  ✔ PO-1: REQUESTED (2 items)');

    await db.insert(schema.purchaseOrders).values({
      poNumber: 'PO-20260512-0002',
      supplierName: 'EPSON',
      status: 'ORDERED',
      requestedBy: 1,
      approvedBy: 1,
      notes: 'CR motor restock',
      orderDate: '2026-05-12',
      totalAmount: '1375000.00',
    });
    await db.insert(schema.poItems).values({
      purchaseOrderId: 2,
      sparePartId: 5,
      quantity: 5,
      unitPrice: '275000.00',
      receivedQty: 0,
      subtotal: '1375000.00',
    });
    console.log('  ✔ PO-2: ORDERED (1 item)');

    await db.insert(schema.purchaseOrders).values({
      poNumber: 'PO-20260510-0003',
      supplierName: 'EPSON',
      status: 'SHIPPED',
      requestedBy: 1,
      approvedBy: 1,
      notes: 'Print head + encoder strip restock',
      orderDate: '2026-05-10',
      totalAmount: '870000.00',
    });
    await db.insert(schema.poItems).values([
      {
        purchaseOrderId: 3,
        sparePartId: 1,
        quantity: 1,
        unitPrice: '750000.00',
        receivedQty: 0,
        subtotal: '750000.00',
      },
      {
        purchaseOrderId: 3,
        sparePartId: 8,
        quantity: 2,
        unitPrice: '45000.00',
        receivedQty: 0,
        subtotal: '90000.00',
      },
    ]);
    console.log('  ✔ PO-3: SHIPPED (2 items)');

    await db.insert(schema.purchaseOrders).values({
      poNumber: 'PO-20260505-0004',
      supplierName: 'EPSON',
      status: 'RECEIVED',
      requestedBy: 1,
      approvedBy: 1,
      notes: 'Main board + PSU - diterima lengkap',
      orderDate: '2026-05-05',
      expectedDate: '2026-05-09',
      receivedDate: '2026-05-09',
      totalAmount: '2250000.00',
    });
    await db.insert(schema.poItems).values([
      {
        purchaseOrderId: 4,
        sparePartId: 2,
        quantity: 3,
        unitPrice: '450000.00',
        receivedQty: 3,
        subtotal: '1350000.00',
      },
      {
        purchaseOrderId: 4,
        sparePartId: 3,
        quantity: 3,
        unitPrice: '325000.00',
        receivedQty: 3,
        subtotal: '975000.00',
      },
    ]);
    console.log('  ✔ PO-4: RECEIVED (2 items, fully received)');

    await db.insert(schema.purchaseOrders).values({
      poNumber: 'PO-20260508-0005',
      supplierName: 'EPSON',
      status: 'CANCELLED',
      requestedBy: 1,
      notes: 'Dibatalkan - supplier tidak punya stok',
      totalAmount: '770000.00',
    });
    await db.insert(schema.poItems).values({
      purchaseOrderId: 5,
      sparePartId: 6,
      quantity: 2,
      unitPrice: '385000.00',
      receivedQty: 0,
      subtotal: '770000.00',
    });
    console.log('  ✔ PO-5: CANCELLED (1 item)');
    console.log(
      '     - REQUESTED: 1, ORDERED: 1, SHIPPED: 1, RECEIVED: 1, CANCELLED: 1'
    );

    // ========================================================================
    // TAHAP 9: INVOICES
    // ========================================================================
    console.log('📦 Tahap 9: Invoices...');
    await db.insert(schema.invoices).values([
      {
        invoiceNumber: 'INV-20260514-0001',
        ticketNumber: 'SR-20260509-0008',
        serviceRequestId: 8,
        clientName: 'PT. Epson Indonesia',
        serviceFee: '250000.00',
        partFee: '275000.00',
        ppn: '66000.00',
        total: '666000.00',
        status: 'PAID',
        paymentMethod: 'TRANSFER',
        invoiceDate: '2026-05-14',
        paidDate: '2026-05-14',
        ppnRate: '11.00',
      },
      {
        invoiceNumber: 'INV-20260514-0002',
        ticketNumber: 'SR-20260510-0009',
        serviceRequestId: 9,
        clientName: 'PT. Epson Indonesia',
        serviceFee: '0.00',
        partFee: '0.00',
        ppn: '0.00',
        total: '0.00',
        status: 'PAID',
        paymentMethod: 'CASH',
        invoiceDate: '2026-05-14',
        paidDate: '2026-05-14',
        ppnRate: '11.00',
      },
      {
        invoiceNumber: 'INV-20260515-0003',
        ticketNumber: 'SR-20260508-0007',
        serviceRequestId: 7,
        clientName: 'SDN Merdeka 01',
        serviceFee: '200000.00',
        partFee: '95000.00',
        ppn: '36300.00',
        total: '366300.00',
        status: 'UNPAID',
        invoiceDate: '2026-05-15',
        ppnRate: '11.00',
      },
    ]);
    console.log('  ✔ 3 invoices dibuat');

    // ========================================================================
    // TAHAP 10: PAYMENT HISTORIES
    // ========================================================================
    console.log('📦 Tahap 10: Payment Histories...');
    await db.insert(schema.paymentHistories).values([
      {
        invoiceId: 1,
        amount: '666000.00',
        paymentMethod: 'TRANSFER',
        paidAt: new Date('2026-05-14T14:00:00'),
        referenceNumber: 'TRF-20260514-001',
        notes: 'Pembayaran via transfer BCA',
      },
      {
        invoiceId: 2,
        amount: '0.00',
        paymentMethod: 'CASH',
        paidAt: new Date('2026-05-14T16:00:00'),
        notes: 'Garansi - tidak ada biaya',
      },
    ]);
    console.log('  ✔ 2 payment histories dibuat');

    // ========================================================================
    // TAHAP 11: STOCK MOVEMENTS
    // ========================================================================
    console.log('📦 Tahap 11: Stock Movements...');
    await db.insert(schema.stockMovements).values([
      {
        sparePartId: 2,
        quantity: 3,
        movementType: 'PO_RECEIVE',
        referenceType: 'PURCHASE_ORDER',
        referenceId: '4',
        performedBy: 1,
        notes: 'PO-20260505-0004 received: 3 pcs Main Board',
      },
      {
        sparePartId: 3,
        quantity: 3,
        movementType: 'PO_RECEIVE',
        referenceType: 'PURCHASE_ORDER',
        referenceId: '4',
        performedBy: 1,
        notes: 'PO-20260505-0004 received: 3 pcs PSU',
      },
      {
        sparePartId: 5,
        quantity: -1,
        movementType: 'SERVICE_USE',
        referenceType: 'SERVICE_REQUEST',
        referenceId: '8',
        performedBy: 3,
        notes: 'CR Motor used for SR-20260509-0008',
      },
      {
        sparePartId: 11,
        quantity: -1,
        movementType: 'SERVICE_USE',
        referenceType: 'SERVICE_REQUEST',
        referenceId: '9',
        performedBy: 2,
        notes: 'Waste Ink Pad used for SR-20260510-0009',
      },
    ]);
    console.log('  ✔ 4 stock movements dibuat');

    // ========================================================================
    // TAHAP 12: EXPENSES
    // ========================================================================
    console.log('📦 Tahap 12: Expenses...');
    await db.insert(schema.expenses).values([
      {
        expenseNumber: 'EXP-20260501-0001',
        expenseType: 'OPERATIONAL',
        description: 'Sewa tempat bulan Mei 2026',
        amount: '1500000.00',
        expenseDate: '2026-05-01',
        category: 'RENT',
        createdBy: 1,
      },
      {
        expenseNumber: 'EXP-20260501-0002',
        expenseType: 'OPERATIONAL',
        description: 'Listrik dan air bulan Mei 2026',
        amount: '500000.00',
        expenseDate: '2026-05-01',
        category: 'UTILITY',
        createdBy: 1,
      },
      {
        expenseNumber: 'EXP-20260509-0003',
        expenseType: 'PO',
        description: 'PO-20260505-0004: Main Board dan PSU',
        poId: 4,
        amount: '2250000.00',
        expenseDate: '2026-05-09',
        category: 'OTHER',
        createdBy: 1,
      },
    ]);
    console.log('  ✔ 3 expenses dibuat');

    // ========================================================================
    // TAHAP 13: CATEGORY MODELS
    // ========================================================================
    console.log('📦 Tahap 13: Category Models...');
    await db.insert(schema.categoryModels).values([
      { name: 'Epson L3210', description: 'Inkjet Multifunction Ecotank' },
      { name: 'Epson L3110', description: 'Inkjet Multifunction Ecotank' },
      { name: 'Epson L8050', description: 'Inkjet Photo Ecotank' },
      { name: 'Epson L15150', description: 'Inkjet A3 Multifunction' },
      { name: 'Epson M2110', description: 'Monochrome Inkjet Ecotank' },
      { name: 'Epson LQ-2190', description: 'Dot Matrix Printer 24-pin' },
      { name: 'Epson LX-310', description: 'Dot Matrix Printer 9-pin' },
      { name: 'Epson TM-U220B', description: 'POS Thermal/Dot Matrix Printer' },
      {
        name: 'Epson SureColor P907',
        description: 'Photo Printer Professional',
      },
      {
        name: 'Epson WorkForce Pro WF-C579R',
        description: 'Business Inkjet Multifunction',
      },
    ]);
    console.log('  ✔ 10 category models dibuat');

    // ========================================================================
    // TAHAP 14: FINANCE SETTINGS
    // ========================================================================
    console.log('📦 Tahap 14: Finance Settings...');
    await db.insert(schema.financeSettings).values([
      { key: 'ppn_rate', value: '11', description: 'PPN rate percentage' },
      {
        key: 'ticket_counter',
        value: '10',
        description: 'Next service request counter',
      },
      {
        key: 'inv_counter_202605',
        value: '3',
        description: 'Invoice counter for 202605',
      },
      {
        key: 'po_counter_20260514',
        value: '1',
        description: 'PO counter for 20260514',
      },
      {
        key: 'po_counter_20260512',
        value: '1',
        description: 'PO counter for 20260512',
      },
      {
        key: 'po_counter_20260510',
        value: '1',
        description: 'PO counter for 20260510',
      },
      {
        key: 'po_counter_20260505',
        value: '1',
        description: 'PO counter for 20260505',
      },
      {
        key: 'po_counter_20260508',
        value: '1',
        description: 'PO counter for 20260508',
      },
    ]);
    console.log('  ✔ 8 finance settings dibuat');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log(
      '\n🚀 [Seeder]: SELAMAT! Semua data tes Epson berhasil disuntikkan.\n'
    );
    console.log('📊 Ringkasan Data:');
    console.log('   ┌─────────────────────────────┬───────┐');
    console.log('   │ Entity                      │ Count │');
    console.log('   ├─────────────────────────────┼───────┤');
    console.log('   │ Staff                       │     3 │');
    console.log('   │ Users                       │     3 │');
    console.log('   │ Customers                   │     7 │');
    console.log('   │ Products                    │    10 │');
    console.log('   │ Spare Parts                 │    14 │');
    console.log('   │ Service Requests            │    10 │');
    console.log('   │ Order Parts                 │     4 │');
    console.log('   │ Service Logs                │    10 │');
    console.log('   │ Purchase Orders             │     5 │');
    console.log('   │ Purchase Order Items        │     7 │');
    console.log('   │ Invoices                    │     3 │');
    console.log('   │ Payment Histories           │     2 │');
    console.log('   │ Stock Movements             │     4 │');
    console.log('   │ Expenses                    │     3 │');
    console.log('   │ Category Models             │    10 │');
    console.log('   │ Finance Settings            │     8 │');
    console.log('   └─────────────────────────────┴───────┘');
  } catch (error) {
    console.error('❌ [Seeder Error]:', error);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
}

runSeeder().catch((error) => {
  console.error('Seeder gagal:', error);
  process.exit(1);
});
