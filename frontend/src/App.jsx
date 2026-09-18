import { useState } from 'react'
import { login, getPaciente, crearConsulta } from './services/api'

function App() {
  // Estados de autenticación
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  // Estados de gestión de pacientes
  const [pacienteIdInput, setPacienteIdInput] = useState('')
  const [paciente, setPaciente] = useState(null)
  const [errorPaciente, setErrorPaciente] = useState('')

  // Estados del formulario para nueva consulta
  const [motivo, setMotivo] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [tratamiento, setTratamiento] = useState('')
  const [mensajeConsulta, setMensajeConsulta] = useState('')

  // Manejo del Login
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const data = await login({ username, password })
      setUser(data)
      setError('')
    } catch (err) {
      setError('Usuario o contraseña incorrectos')
    }
  }

  // Buscar un paciente por ID
  const handleBuscarPaciente = async (e) => {
    e.preventDefault()
    if (!pacienteIdInput.trim()) return

    try {
      setErrorPaciente('')
      const data = await getPaciente(pacienteIdInput.trim())
      setPaciente(data)
    } catch (err) {
      setPaciente(null)
      setErrorPaciente('Paciente no encontrado o ID no válido')
    }
  }

  // Registrar una nueva consulta médica
  const handleNuevaConsulta = async (e) => {
    e.preventDefault()
    try {
      const datosNuevaConsulta = {
        pacienteId: paciente.id,
        motivo,
        diagnostico,
        tratamiento,
        medico: user.nombre
      }

      const pacienteActualizado = await crearConsulta(datosNuevaConsulta)
      setPaciente(pacienteActualizado) // Actualiza el historial en pantalla automáticamente
      
      // Limpiar campos del formulario
      setMotivo('')
      setDiagnostico('')
      setTratamiento('')
      setMensajeConsulta('✔︎ Consulta registrada exitosamente')
      setTimeout(() => setMensajeConsulta(''), 3000)
    } catch (err) {
      setMensajeConsulta('✘ Error al guardar la consulta')
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Clínica Médica</h1>

      {!user ? (
        /* VISTA DE LOGIN */
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
          <h3>Iniciar Sesión</h3>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <input 
            type="text" 
            placeholder="Usuario (ej. nombre.de.usuario)" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Contraseña (ej. medico123)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button type="submit">Ingresar</button>
        </form>
      ) : (
        /* VISTA PRINCIPAL DEL MÉDICO */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Bienvenido, {user.nombre} ☻</h2>
            <button onClick={() => { setUser(null); setPaciente(null); }}>Cerrar Sesión</button>
          </div>
          
          <hr />

          {/* BUSCADOR DE PACIENTE */}
          <h3> Buscar Ficha de Paciente</h3>
          <form onSubmit={handleBuscarPaciente} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Ingrese ID del paciente..." 
              value={pacienteIdInput} 
              onChange={(e) => setPacienteIdInput(e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <button type="submit">Buscar</button>
          </form>

          {errorPaciente && <p style={{ color: 'red' }}>{errorPaciente}</p>}

          {/* INFORMACIÓN DEL PACIENTE Y SU HISTORIAL MEDICO */}
          {paciente && (
            <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9' }}>
              <h2>Ficha Médica</h2>
              <p><strong>ID:</strong> {paciente.id}</p>
              <p><strong>Nombre:</strong> {paciente.nombre}</p>
              <p><strong>Teléfono:</strong> {paciente.num || 'No registrado'}</p>
              <p><strong>Edad:</strong> {paciente.edad} años</p>
              <p><strong>Género:</strong> {paciente.genero}</p>

              <h4>Historial de Consultas:</h4>
              {paciente.historialConsultas.length === 0 ? (
                <p>Sin consultas registradas.</p>
              ) : (
                paciente.historialConsultas.map((c, index) => (
                  <div key={index} style={{ background: '#fff', padding: '10px', marginBottom: '8px', borderLeft: '4px solid #007bff', borderRadius: '4px' }}>
                    <p><strong>Fecha:</strong> {new Date(c.fecha).toLocaleDateString()}</p>
                    <p><strong>Motivo:</strong> {c.motivo}</p>
                    <p><strong>Diagnóstico:</strong> {c.diagnostico}</p>
                    <p><strong>Tratamiento:</strong> {c.tratamiento}</p>
                    <p><strong>Atendido por:</strong> {c.medico}</p>
                  </div>
                ))
              )}

              <hr />

              {/* FORMULARIO DE NUEVA CONSULTA */}
              <h4>✐ Agregar Nueva Consulta</h4>
              {mensajeConsulta && <p style={{ fontWeight: 'bold' }}>{mensajeConsulta}</p>}
              <form onSubmit={handleNuevaConsulta} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Motivo de la consulta" 
                  value={motivo} 
                  onChange={(e) => setMotivo(e.target.value)} 
                  required
                />
                <input 
                  type="text" 
                  placeholder="Diagnóstico médico" 
                  value={diagnostico} 
                  onChange={(e) => setDiagnostico(e.target.value)} 
                  required
                />
                <textarea 
                  placeholder="Tratamiento prescrito" 
                  value={tratamiento} 
                  onChange={(e) => setTratamiento(e.target.value)} 
                  rows={3}
                />
                <button type="submit">Guardar Consulta</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App