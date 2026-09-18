import axios from 'axios'

// URL real de tu backend en Codespaces
const API_URL = 'https://laughing-space-potato-5vvwj5q4wqgc4rgr-3001.app.github.dev/api'

// pa iniciar sesión
export const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials)
  return response.data
}

// pa obtener un paciente por ID
export const getPaciente = async (id) => {
  const response = await axios.get(`${API_URL}/pacientes/${id}`)
  return response.data
}

// pa agregar una nueva consulta
export const crearConsulta = async (datosConsulta) => {
  const response = await axios.post(`${API_URL}/consultas`, datosConsulta)
  return response.data
}