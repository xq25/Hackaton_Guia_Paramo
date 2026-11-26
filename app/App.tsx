import { StatusBar } from 'expo-status-bar';
import { almacen } from './src/datos/almacen';
import { ProveedorApp } from './src/pantallas/ContextoApp';
import { PantallaPrincipal } from './src/pantallas/PantallaPrincipal';

export default function App() {
  return (
    <ProveedorApp almacen={almacen}>
      <StatusBar style="dark" />
      <PantallaPrincipal />
    </ProveedorApp>
  );
}
