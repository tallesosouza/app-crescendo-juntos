export class AppError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = new.target.name;
  }
}
export class BadRequestError extends AppError {
  constructor(message: string) { super(message, 400); }
}
export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}
export class GoneError extends AppError {
  constructor(message: string) { super(message, 410); }
}
