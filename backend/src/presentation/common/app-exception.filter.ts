import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AppError } from '../../domain/errors/app-error';

@Catch(AppError)
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: AppError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    res.status(exception.status).json({ statusCode: exception.status, message: exception.message });
  }
}
