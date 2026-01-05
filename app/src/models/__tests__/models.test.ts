import { Usuario } from '../../models/usuario';
import { Entrada } from '../../models/entrada';
import { Externa } from '../../models/externa';
import { Interna } from '../../models/interna';
import { Torno } from '../../models/torno';

describe('Model: Usuario', () => {
    it('debería crear una instancia de Usuario correctamente', () => {
        const usuario = new Usuario(
            1,
            'Juan Pérez',
            'juan@example.com',
            'hashedPassword123',
            true,
            'admin',
            'EMP001'
        );

        expect(usuario.id).toBe(1);
        expect(usuario.name).toBe('Juan Pérez');
        expect(usuario.email).toBe('juan@example.com');
        expect(usuario.password).toBe('hashedPassword123');
        expect(usuario.online).toBe(true);
        expect(usuario.type).toBe('admin');
        expect(usuario.codigo_empleado).toBe('EMP001');
    });

    it('debería crear Usuario sin codigo_empleado', () => {
        const usuario = new Usuario(2, 'María', 'maria@example.com', 'pass', false, 'user');

        expect(usuario.id).toBe(2);
        expect(usuario.name).toBe('María');
        expect(usuario.codigo_empleado).toBeUndefined();
    });

    it('debería tener todas las propiedades necesarias', () => {
        const usuario = new Usuario(3, 'Carlos', 'carlos@test.com', 'pwd', true, 'supervisor');

        expect(usuario).toHaveProperty('id');
        expect(usuario).toHaveProperty('name');
        expect(usuario).toHaveProperty('email');
        expect(usuario).toHaveProperty('password');
        expect(usuario).toHaveProperty('online');
        expect(usuario).toHaveProperty('type');
    });
});

describe('Model: Entrada', () => {
    it('debería crear una instancia de Entrada correctamente', () => {
        const entrada = new Entrada(
            1,
            'Juan Driver',
            'Empresa XYZ',
            'ABC-1234',
            'General',
            new Date('2025-01-05 08:00:00'),
            'firma_path',
            new Date('2025-01-05 18:00:00'),
            true,
            false,
            1
        );

        expect(entrada.id).toBe(1);
        expect(entrada.nombreConductor).toBe('Juan Driver');
        expect(entrada.empresa).toBe('Empresa XYZ');
        expect(entrada.matricula).toBe('ABC-1234');
        expect(entrada.claseCarga).toBe('General');
        expect(entrada.usuario).toBe(1);
    });

    it('debería permitir Entrada sin fecha de salida', () => {
        const entrada = new Entrada(
            2,
            'Pedro Transportista',
            'Empresa ABC',
            'XYZ-5678',
            'Especial',
            new Date('2025-01-05 10:00:00'),
            'firma_path',
            undefined, // Sin fecha salida
            false,
            false,
            2
        );

        expect(entrada.fechaSalida).toBeUndefined();
        expect(entrada.nombreConductor).toBe('Pedro Transportista');
    });
});

describe('Model: Externa', () => {
    it('debería crear una instancia de Externa correctamente', () => {
        const externa = new Externa(
            1,
            'Contact Name',
            'Supplier Co',
            'Peticionario',
            '600123123',
            'firma_externa',
            true,
            new Date('2025-01-05 09:00:00'),
            new Date('2025-01-05 18:00:00'),
            'nota interna',
            1
        );

        expect(externa.id).toBe(1);
        expect(externa.nombrePersona).toBe('Contact Name');
        expect(externa.empresaExterior).toBe('Supplier Co');
        expect(externa.peticionario).toBe('Peticionario');
        expect(externa.telefonoPersona).toBe('600123123');
        expect(externa.recepcion).toBe(true);
        expect(externa.usuario).toBe(1);
    });

    it('debería permitir Externa sin fechaSalida', () => {
        const externa = new Externa(
            2,
            'Otro Nombre',
            'Empresa B',
            'Requester',
            '700987654',
            'firma2',
            false,
            new Date('2025-01-06 10:00:00'),
            undefined as any,
            '',
            2
        );

        expect(externa.fechaSalida).toBeUndefined();
        expect(externa.recepcion).toBe(false);
    });
});

describe('Model: Interna', () => {
    it('debería crear una instancia de Interna correctamente', () => {
        const interna = new Interna(
            1,
            'EMP001',
            'John Intern',
            new Date('2025-01-05 17:30:00'),
            new Date('2025-01-05 08:30:00'),
            'motivo prueba'
        );

        expect(interna.id).toBe(1);
        expect(interna.codigoEmpleado).toBe('EMP001');
        expect(interna.nombrePersona).toBe('John Intern');
        expect(interna.fechaEntrada).toEqual(new Date('2025-01-05 08:30:00'));
        expect(interna.fechaSalida).toEqual(new Date('2025-01-05 17:30:00'));
        expect(interna.motivo).toBe('motivo prueba');
    });
});

describe('Model: Torno', () => {
    it('debería crear una instancia de Torno correctamente', () => {
        const torno = new Torno(
            1,
            'EMP-TORNO',
            'Driver Name',
            new Date('2025-01-05 19:00:00'),
            new Date('2025-01-05 07:00:00')
        );

        expect(torno.id).toBe(1);
        expect(torno.codigoEmpleado).toBe('EMP-TORNO');
        expect(torno.nombrePersona).toBe('Driver Name');
        expect(torno.fechaEntrada).toEqual(new Date('2025-01-05 07:00:00'));
        expect(torno.fechaSalida).toEqual(new Date('2025-01-05 19:00:00'));
    });

    it('debería mantener fechas correctas en Torno', () => {
        const fechaEntrada = new Date('2025-01-04 06:00:00');
        const fechaSalida = new Date('2025-01-04 20:00:00');

        const torno = new Torno(
            2,
            'EMP-002',
            'Driver Y',
            fechaSalida,
            fechaEntrada
        );

        expect(torno.fechaEntrada).toEqual(fechaEntrada);
        expect(torno.fechaSalida).toEqual(fechaSalida);
    });
});
