import { Request } from 'express';
import { ReqId } from 'pino-http';

// Tipos para Usuario
export interface Usuario {
  id: number;
  name: string;
  email: string;
  password: string;
  online: boolean;
  type: string;
  date_creation: Date;
  date_modification?: Date;
  codigo_empleado?: string;
}

export interface UsuarioLogin {
  email: string;
  password: string;
}

// Tipos para Entradas de Vehículos
export interface EntradaVehiculo {
  id: number;
  firma: string;
  recepcion: boolean;
  vigilancia: boolean;
  empresa: string;
  nombre_conductor: string;
  matricula: string;
  date_creation: Date;
  fecha_entrada: Date;
  fecha_salida?: Date;
  date_modification?: Date;
  clase_carga?: string;
  usuario: number;
}

// Tipos para Empresas Exteriores
export interface EmpresaExterior {
  id: number;
  nombre_persona: string;
  empresa_exterior: string;
  peticionario?: string;
  telefono_persona?: string;
  date_creation: Date;
  fecha_entrada: Date;
  firma?: string;
  nota?: string;
  usuario: number;
  recepcion: boolean;
  fecha_salida?: Date;
  date_modification?: Date;
}

// Tipos para Salidas de Empleados (Internas)
export interface SalidaEmpleado {
  id: number;
  codigo_empleado: string;
  nombre_persona: string;
  fecha_salida?: Date;
  fecha_entrada?: Date;
  date_creation: Date;
  date_modification?: Date;
  usuario: string;
  motivo?: string;
}

// Tipos para Salidas de Tornos
export interface SalidaTorno {
  id: number;
  codigo_empleado: string;
  fecha_entrada?: Date;
  fecha_salida?: Date;
  usuario: number;
  date_creation: Date;
  date_modification?: Date;
}

// Tipos para JWT
export interface JWTPayload {
  id: number;
}

// Tipos para Request extendido con usuario autenticado
export interface AuthRequest extends Request {
  uid?: unknown;
  id: ReqId;
}
