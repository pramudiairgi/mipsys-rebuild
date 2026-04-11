import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ShipmentsRepository } from './shipments.repository';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(private readonly repo: ShipmentsRepository) {}

  // Perbaikan 1: Pastikan nama method sesuai dengan yang dipanggil Controller
  async findAll() {
    return await this.repo.findAll();
  }

  async syncFromLegacy() {
    const baseUrl = process.env.LEGACY_BASE_URL ?? '';
    const loginUrl = `${baseUrl}/defaultvalid.asp`;
    const dataUrl = `${baseUrl}/SCMAINMENU.asp`;

    try {
      const formData = new URLSearchParams();
      // Perbaikan 2: Gunakan nullish coalescing (?? '') agar tidak undefined
      formData.append('varUSERID', process.env.LEGACY_USER ?? '');
      formData.append('varPASSWORD', process.env.LEGACY_PASS ?? '');
      formData.append('submit1', 'SignOn');

      const loginResponse = await axios.post(loginUrl, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const cookies = loginResponse.headers['set-cookie'];
      if (!cookies) throw new Error('Cookie tidak ditemukan');

      const { data: html } = await axios.get(dataUrl, {
        headers: { 'Cookie': cookies.join('; ') }
      });

      const $ = cheerio.load(html);
      let newEntriesCount = 0;

      // Perbaikan 3: Ubah .each() menjadi for...of agar bisa await
      const rows = $('table tr').toArray();
      
      for (const el of rows) {
        const cols = $(el).find('td');
        const picklistNo = $(cols[3]).text().trim();

        if (picklistNo && picklistNo !== 'PICKLIST NO') {
          const existing = await this.repo.findByPicklist(picklistNo);
          
          if (existing.length === 0) {
            const rawDate = $(cols[2]).text().trim();
            const [d, m, y] = rawDate.split('/');

            await this.repo.create({
              location_id: 1, 
              status: $(cols[1]).text().trim(),
              issue_date: new Date(`${y}-${m}-${d}`),
              picklist_no: picklistNo,
            });
            newEntriesCount++;
          }
        }
      }

      return { success: true, inserted: newEntriesCount };
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      throw new InternalServerErrorException('Gagal sinkronisasi');
    }
  }
}