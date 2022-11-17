// Imports
import express from 'express'


// Create app
const app = express();

// Route
const imageRoute = require('./routes/images')

app.use('/images', imageRoute)

export default app;