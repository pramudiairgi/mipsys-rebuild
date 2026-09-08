/**
 * Terbilang Rupiah — bebas typo, WCAG-friendly
 * Dipakai oleh InvoicePrintTemplate & QuotePrintTemplate
 * Fix: "Dua Belas" (bukan Duabelas), "Tiga Belas", dst., "Seribu" handling
 */

const UNITS = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];
const ONES = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];
const TENS = [
  '',
  '',
  'Dua Puluh',
  'Tiga Puluh',
  'Empat Puluh',
  'Lima Puluh',
  'Enam Puluh',
  'Tujuh Puluh',
  'Delapan Puluh',
  'Sembilan Puluh',
];

function convertBelowThousand(n: number): string {
  if (n === 0) return '';
  if (n < 12) return ONES[n];
  if (n < 20) return ONES[n - 10] + ' Belas';
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const rest = n % 10;
    return TENS[ten] + (rest ? ' ' + ONES[rest] : '');
  }
  if (n < 200) {
    // 100-199 -> Seratus ...
    const rest = n - 100;
    return 'Seratus' + (rest ? ' ' + convertBelowThousand(rest) : '');
  }
  if (n < 1000) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return ONES[hundred] + ' Ratus' + (rest ? ' ' + convertBelowThousand(rest) : '');
  }
  return '';
}

function convert(n: number): string {
  if (n === 0) return '';
  if (n < 0) return 'Minus ' + convert(-n);

  if (n < 1000) return convertBelowThousand(n);

  for (let i = 1; i < UNITS.length; i++) {
    const divisor = Math.pow(1000, i);
    if (n < divisor * 1000) {
      const quotient = Math.floor(n / divisor);
      const remainder = n % divisor;

      // Khusus 1000 -> Seribu, bukan Satu Ribu
      let prefix: string;
      if (quotient === 1 && i === 1) {
        prefix = 'Se';
      } else {
        prefix = convert(quotient) + ' ';
      }

      const unitWord = UNITS[i];
      const remainderWord = remainder ? ' ' + convert(remainder) : '';
      return prefix + unitWord + remainderWord;
    }
  }
  return '';
}

/**
 * Terbilang untuk nominal Rupiah.
 * Contoh: terbilang(327450) => "Tiga Ratus Dua Puluh Tujuh Ribu Empat Ratus Lima Puluh Rupiah"
 */
export function terbilang(amount: number): string {
  const rounded = Math.round(amount);

  if (rounded === 0) return 'Nol Rupiah';
  if (!Number.isFinite(rounded)) return 'Nol Rupiah';

  return convert(rounded).trim().replace(/\s+/g, ' ') + ' Rupiah';
}

/**
 * Alias untuk kompatibilitas dengan QuotePrintTemplate lama
 */
export function numberToWords(num: number): string {
  return terbilang(num);
}
