import { useState } from 'react';
import TablaReclamos from './TablaReclamos';
import FormularioReclamo from './FormularioReclamo';
import DetalleReclamo from './DetalleReclamo';

export default function GestionReclamos() {
  const [modalNuevo,          setModalNuevo]          = useState(false);
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState(null);
  const [actualizacion,       setActualizacion]       = useState(0);

  function handleGuardado() {
    setModalNuevo(false);
    setActualizacion(a => a + 1);
  }

  function handleActualizado() {
    setActualizacion(a => a + 1);
  }

  return (
    <div className="seccion-content">
      <TablaReclamos
        onSeleccionar={r => setReclamoSeleccionado(r.id)}
        onNuevo={() => setModalNuevo(true)}
        reclamoActualizado={actualizacion}
      />

      {modalNuevo && (
        <FormularioReclamo
          onGuardado={handleGuardado}
          onCancelar={() => setModalNuevo(false)}
        />
      )}

      {reclamoSeleccionado && (
        <DetalleReclamo
          reclamoId={reclamoSeleccionado}
          onCerrar={() => setReclamoSeleccionado(null)}
          onActualizado={handleActualizado}
        />
      )}
    </div>
  );
}
