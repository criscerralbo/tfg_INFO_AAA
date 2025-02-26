const db = require('../db');

// Obtener todos los quizzes (juegos de tipo 'quiz')
exports.getQuizzes = (req, res) => {
    db.query("SELECT * FROM juegos WHERE tipo = 'quiz'", (err, results) => {
        if (err) {
            console.error('Error al obtener quizzes:', err);
            return res.status(500).json({ error: 'Error al obtener quizzes' });
        }
        res.status(200).json(results);
    });
};

// Crear un nuevo quiz
exports.createQuiz = (req, res) => {
    const { nombre, descripcion } = req.body;
    const id_profesor = req.session.usuarioId;  // Se asume que el profesor está en sesión
    if (!nombre || !id_profesor) {
        return res.status(400).json({ error: 'Faltan datos para crear el quiz' });
    }
    db.query(
        "INSERT INTO juegos (nombre, descripcion, tipo, id_profesor) VALUES (?, ?, 'quiz', ?)",
        [nombre, descripcion, id_profesor],
        (err, result) => {
            if (err) {
                console.error('Error al crear quiz:', err);
                return res.status(500).json({ error: 'Error al crear quiz' });
            }
            res.status(201).json({ success: 'Quiz creado', quizId: result.insertId });
        }
    );
};

// Agregar una pregunta a un quiz, con sus opciones
// Se espera en el body: { texto, opciones: [{ texto, es_correcta }, ...] }
exports.addQuestion = (req, res) => {
    const quizId = req.params.quizId;
    const { texto, opciones } = req.body;
    if (!texto || !opciones || !Array.isArray(opciones) || opciones.length === 0) {
        return res.status(400).json({ error: 'Faltan datos para agregar la pregunta' });
    }
    // Insertar la pregunta
    db.query(
        "INSERT INTO preguntas (id_juego, texto) VALUES (?, ?)",
        [quizId, texto],
        (err, result) => {
            if (err) {
                console.error('Error al insertar pregunta:', err);
                return res.status(500).json({ error: 'Error al insertar pregunta' });
            }
            const preguntaId = result.insertId;
            // Preparar los valores para cada opción
            const values = opciones.map(opt => [preguntaId, opt.texto, opt.es_correcta ? 1 : 0]);
            db.query(
                "INSERT INTO opciones (id_pregunta, texto, es_correcta) VALUES ?",
                [values],
                (err) => {
                    if (err) {
                        console.error('Error al insertar opciones:', err);
                        return res.status(500).json({ error: 'Error al insertar opciones' });
                    }
                    res.status(201).json({ success: 'Pregunta y opciones agregadas' });
                }
            );
        }
    );
};

// Obtener todas las preguntas y sus opciones para un quiz
exports.getQuestions = (req, res) => {
    const quizId = req.params.quizId;
    db.query(
        "SELECT * FROM preguntas WHERE id_juego = ?",
        [quizId],
        (err, preguntas) => {
            if (err) {
                console.error('Error al obtener preguntas:', err);
                return res.status(500).json({ error: 'Error al obtener preguntas' });
            }
            if (preguntas.length === 0) {
                return res.status(200).json([]);
            }
            let preguntasConOpciones = [];
            let count = 0;
            preguntas.forEach(pregunta => {
                db.query(
                    "SELECT * FROM opciones WHERE id_pregunta = ?",
                    [pregunta.id],
                    (err, opciones) => {
                        if (err) {
                            console.error('Error al obtener opciones:', err);
                            return res.status(500).json({ error: 'Error al obtener opciones' });
                        }
                        preguntasConOpciones.push({
                            ...pregunta,
                            opciones: opciones
                        });
                        count++;
                        if (count === preguntas.length) {
                            res.status(200).json(preguntasConOpciones);
                        }
                    }
                );
            });
        }
    );
};
