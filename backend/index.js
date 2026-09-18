require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Conexión a MongoDB 
const MONGODB_URI = process.env.MONGODB_URI
mongoose.set('strictQuery', false)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Conectado exitosamente a MongoDB Atlas')
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB:', error.message)
  })

// ESQUEMAS Y MODELOS DE MONGOOSE

// Schema Usuario
const usuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  nombre: String,
  passwordHash: String,
})

usuarioSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

const Usuario = mongoose.model('Usuario', usuarioSchema)

// Schema Consulta
const consultaSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  motivo: { type: String, required: true },
  diagnostico: { type: String, required: true },
  tratamiento: String,
  medico: String,
})

consultaSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Consulta = mongoose.model('Consulta', consultaSchema)

// Schema Paciente (CON EL CAMPO NUM AGREGADO)
const pacienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  num: String,
  rut: String,
  edad: Number,
  genero: String,
  historialConsultas: [consultaSchema]
})

pacienteSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Paciente = mongoose.model('Paciente', pacienteSchema)

// RUTAS DE LA API 

// 1. Ruta para poblar la base de datos (Seed)
app.get('/api/seed', async (req, res) => {
  try {
    await Usuario.deleteMany({})
    await Paciente.deleteMany({})

    const passwordHash = await bcrypt.hash('medico123', 10)
    const usuarioPrueba = new Usuario({
      username: 'doctorgomez',
      nombre: 'Dr. Roberto Gómez',
      passwordHash,
    })
    await usuarioPrueba.save()

    const pacientePrueba = new Paciente({
      nombre: 'María López',
      num: '504-3359647',
      edad: 34,
      genero: 'Femenino',
      historialConsultas: [
        {
          motivo: 'Dolor de cabeza persistente',
          diagnostico: 'Migraña leve',
          tratamiento: 'Paracetamol 500mg cada 8 horas',
          medico: 'Dr. Roberto Gómez'
        }
      ]
    })
    await pacientePrueba.save()

    res.json({ message: 'Base de datos inicializada con datos de prueba', usuario: 'doctorgomez', password: 'medico123' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body

  const user = await Usuario.findOne({ username })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ error: 'Usuario o contraseña inválidos' })
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  }

  const token = jwt.sign(userForToken, process.env.SECRET || 'secretKey')

  res.status(200).send({ token, username: user.username, nombre: user.nombre })
})

// 3. Ruta para obtener la ficha de un paciente por su ID
app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const paciente = await Paciente.findById(req.params.id)
    if (paciente) {
      res.json(paciente)
    } else {
      res.status(404).json({ error: 'Paciente no encontrado' })
    }
  } catch (error) {
    res.status(400).json({ error: 'ID de paciente no válido' })
  }
})

// 4. Ruta para registrar una nueva consulta médica
app.post('/api/consultas', async (req, res) => {
  const { pacienteId, motivo, diagnostico, tratamiento, medico } = req.body

  if (!motivo || !diagnostico || !pacienteId) {
    return res.status(400).json({ error: 'Motivo, diagnóstico y pacienteId son requeridos' })
  }

  try {
    const paciente = await Paciente.findById(pacienteId)
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    const nuevaConsulta = {
      motivo,
      diagnostico,
      tratamiento,
      medico,
      fecha: new Date()
    }

    paciente.historialConsultas.push(nuevaConsulta)
    await paciente.save()

    res.status(201).json(paciente)
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar la consulta' })
  }
})

// Puerto y escucha
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
})

// 5. Ruta para registrar un nuevo paciente
app.post('/api/pacientes', async (req, res) => {
  const { nombre, num, rut, edad, genero } = req.body

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' })
  }

  try {
    const nuevoPaciente = new Paciente({
      nombre,
      num,
      rut,
      edad,
      genero,
      historialConsultas: []
    })

    const pacienteGuardado = await nuevoPaciente.save()
    res.status(201).json(pacienteGuardado)
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el paciente' })
  }
})