import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db/db';
import { spareParts } from '../db/schema';
import { eq, sql, like } from 'drizzle-orm';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Injectable()
export class SparePartsService {
  async findAll() {
    return await db.select().from(spareParts);
  }

  async findOne(id: number) {
    const [result] = await db
      .select()
      .from(spareParts)
      .where(eq(spareParts.id, id));
    if (!result)
      throw new NotFoundException(`Suku cadang ID ${id} tidak ditemukan`);
    return result;
  }

  async findByCode(code: string) {
    const [result] = await db
      .select()
      .from(spareParts)
      .where(eq(spareParts.partCode, code));
    return result;
  }

  async search(query: string) {
    return await db
      .select()
      .from(spareParts)
      .where(like(spareParts.partName, `%${query}%`));
  }

  async create(data: CreateSparePartDto) {
    // Simpan hasil eksekusi Drizzle
    const [result] = await db.insert(spareParts).values(data);

    // Kembalikan objek yang lebih mudah dibaca Frontend
    return {
      message: 'Spare part berhasil ditambahkan',
      insertedId: result.insertId,
    };
  }

  async addStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah penambahan harus lebih dari 0');

    await this.findOne(id); // Validasi barang ada

    return await db
      .update(spareParts)
      .set({ stock: sql`${spareParts.stock} + ${quantity}` })
      .where(eq(spareParts.id, id));
  }

  // FUNGSI BARU: Update Data (Nama, Harga, dll)
  async update(id: number, data: UpdateSparePartDto) {
    const result = await db
      .update(spareParts)
      .set(data)
      .where(eq(spareParts.id, id));

    return {
      message: 'Data suku cadang berhasil diperbarui',
      affectedRows: result[0].affectedRows,
    };
  }

  // FUNGSI BARU: Hapus Data
  async remove(id: number) {
    await this.findOne(id); // Cek dulu barangnya
    return await db.delete(spareParts).where(eq(spareParts.id, id));
  }

  // FUNGSI KRUSIAL: Mengurangi stok saat servis
  async reduceStock(id: number, quantity: number) {
    const item = await this.findOne(id);

    const currentStock = item.stock ?? 0;

    if (currentStock < quantity) {
      throw new BadRequestException(
        `Stok tidak cukup. Sisa: ${currentStock}, Diminta: ${quantity}`
      );
    }

    return await db
      .update(spareParts)
      .set({ stock: sql`${spareParts.stock} - ${quantity}` })
      .where(eq(spareParts.id, id));
  }
}
