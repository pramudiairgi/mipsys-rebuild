import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

// ============================================================================
// PENYARING ERROR TERSTANDARISASI (STANDAR REKAYASA PERANGKAT LUNAK)
// Menjamin seluruh respons gagal memiliki struktur JSON yang baku (ISO Contract)
// ============================================================================

@Catch()
export class StandardHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] =
      'Terjadi gangguan internal pada peladen backend.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Ekstraksi pesan standar bawaan validasi NestJS / class-validator
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as Record<string, unknown>;
        if (typeof body.message === 'string') {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = body.message; // Array error validasi DTO
        }
      }
    } else if (exception instanceof Error) {
      // Menangkap error mentah dari database / Drizzle ORM
      message = `Kendala Pangkalan Data: ${exception.message}`;
    }

    // Mengirimkan format baku yang klop 100% dengan apiClient.ts Frontend
    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}
