// jest.setup.ts - Se ejecuta antes de todos los tests
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Asegurar que JWT_KEY existe para los tests
if (!process.env.JWT_KEY) {
  process.env.JWT_KEY = 'test-jwt-key-very-long-string-for-testing-purposes';
}
