/**
 * B0 (stub): pantalla del editor de fichas. La contraseña, la lista y el formulario llegan en B7.
 * Sin estilo propio hasta S10 (pantallas/tema.ts y pantallas/comunes/ de C).
 */
import React from 'react';
import { Button, Text, View } from 'react-native';
import type { Asistente } from '../../asistente';

export function PantallaEditor(props: { asistente: Asistente; alCerrar: () => void }): React.JSX.Element {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 }}>
      <Text>Editor en construcción</Text>
      <Button title="Cerrar" onPress={props.alCerrar} />
    </View>
  );
}
