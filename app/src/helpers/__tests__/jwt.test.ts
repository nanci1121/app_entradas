import { generarJWT, comprobarJWT } from '../../helpers/jwt';

describe('JWT Helper - Tests Unitarios', () => {
  
  describe('generarJWT', () => {
    it('debería generar un token JWT válido', async () => {
      const userId = 123;
      const token = await generarJWT(userId);
      
      // Verificar que retorna un string
      expect(typeof token).toBe('string');
      
      // Verificar que tiene la estructura JWT (3 partes separadas por puntos)
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('debería generar tokens diferentes para usuarios diferentes', async () => {
      const token1 = await generarJWT(1);
      const token2 = await generarJWT(2);
      
      // Los tokens deben ser diferentes
      expect(token1).not.toBe(token2);
    });
  });

  describe('comprobarJWT', () => {
    it('debería decodificar un token válido', async () => {
      const userId = 456;
      const token = await generarJWT(userId);
      const [isValid, id] = comprobarJWT(token);
      
      // Verificar que es válido
      expect(isValid).toBe(true);
      expect(id).toBe(userId);
    });

    it('debería retornar falso con un token inválido', () => {
      const tokenInvalido = 'token.invalido.aqui';
      const [isValid] = comprobarJWT(tokenInvalido);
      
      // No debería ser válido
      expect(isValid).toBe(false);
    });

    it('debería retornar falso con un token expirado o vacío', () => {
      const [isValid1] = comprobarJWT('');
      const [isValid2] = comprobarJWT('null');
      
      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });
});
