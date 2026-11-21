import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccionesToma } from '@/components/AccionesToma';

const props = () => ({
  nombre: 'Ibuprofeno',
  onTomada: jest.fn(),
  onOmitida: jest.fn(),
  onPosponer: jest.fn(),
});

describe('AccionesToma', () => {
  it('cada acción tiene botón con etiqueta accesible', () => {
    const p = props();
    render(<AccionesToma habilitado {...p} />);
    fireEvent.press(screen.getByLabelText('Marcar Ibuprofeno como tomada'));
    fireEvent.press(screen.getByLabelText('Omitir la toma de Ibuprofeno'));
    fireEvent.press(screen.getByLabelText('Posponer Ibuprofeno 10 minutos'));
    expect(p.onTomada).toHaveBeenCalledTimes(1);
    expect(p.onOmitida).toHaveBeenCalledTimes(1);
    expect(p.onPosponer).toHaveBeenCalledTimes(1);
  });

  it('deshabilitados no ejecutan acciones (toma futura)', () => {
    const p = props();
    render(<AccionesToma habilitado={false} {...p} />);
    fireEvent.press(screen.getByLabelText('Marcar Ibuprofeno como tomada'));
    expect(p.onTomada).not.toHaveBeenCalled();
  });
});
