import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // Map status codes to human-friendly defaults if service-provided message is missing/unhelpful.
  private readonly statusMessageMap: Record<number, string> = {
    [HttpStatus.UNAUTHORIZED]: 'Unauthorized: invalid credentials or session expired',
    [HttpStatus.FORBIDDEN]: 'Forbidden: insufficient permissions',
    [HttpStatus.NOT_FOUND]: 'Resource not found',
    [HttpStatus.BAD_REQUEST]: 'Bad request',
  };

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const extractedMessage =
        typeof res === 'string'
          ? res
          : (res as any).message || (res as any).error || 'Request failed';
      const message =
        this.normalizeMessage(extractedMessage) ?? this.statusMessageMap[status] ?? 'Request failed';

      response.status(status).json({
        statusCode: status,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeMessage(message: unknown): string | null {
    if (!message) return null;
    if (Array.isArray(message)) {
      return message.join('; ');
    }
    if (typeof message === 'string') {
      return message;
    }
    if (typeof message === 'object') {
      const maybeMsg = (message as any).message;
      if (typeof maybeMsg === 'string') return maybeMsg;
      if (Array.isArray(maybeMsg)) return maybeMsg.join('; ');
    }
    return null;
  }
}
