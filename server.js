const express = require('express');
const cors = require('cors');
const { EdgeTTS } = require('edge-tts-universal');

const app = express();
const PORT = 3000;

// Activation CORS
app.use(cors());
app.use(express.json());

// --- Configuration du découpage intelligent ---
const MAX_CHARS_PER_CHUNK = 3000; // Taille max d'un bloc (ajustable)

/**
 * Découpe un texte en blocs en respectant les fins de phrase.
 * @param {string} text - Le texte complet.
 * @returns {string[]} - Tableau de blocs.
 */
function splitTextSmartly(text) {
    // Nettoyer les espaces multiples et les sauts de ligne inutiles
    text = text.replace(/\s+/g, ' ').trim();
    
    if (text.length <= MAX_CHARS_PER_CHUNK) {
        return [text];
    }

    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
        let end = Math.min(start + MAX_CHARS_PER_CHUNK, text.length);
        
        // Si on n'est pas à la fin du texte, on cherche une coupure intelligente
        if (end < text.length) {
            // Chercher la dernière ponctuation de fin de phrase dans la zone de recherche
            const searchWindow = text.substring(start, end);
            const lastPeriod = searchWindow.lastIndexOf('.');
            const lastExclamation = searchWindow.lastIndexOf('!');
            const lastQuestion = searchWindow.lastIndexOf('?');
            const lastNewline = searchWindow.lastIndexOf('\n');
            
            // Prendre la position la plus proche de la fin (mais pas trop proche du début)
            const breakPoints = [lastPeriod, lastExclamation, lastQuestion, lastNewline]
                .filter(pos => pos > MAX_CHARS_PER_CHUNK * 0.5); // Éviter les blocs trop courts
            
            let breakPos = Math.max(...breakPoints);
            
            if (breakPos > 0) {
                end = start + breakPos + 1; // Inclure la ponctuation
            } else {
                // Aucune bonne coupure trouvée, on coupe au dernier espace
                const lastSpace = searchWindow.lastIndexOf(' ');
                if (lastSpace > MAX_CHARS_PER_CHUNK * 0.5) {
                    end = start + lastSpace + 1;
                }
                // Sinon on garde la coupure forcée
            }
        }
        
        let chunk = text.substring(start, end).trim();
        if (chunk) {
            chunks.push(chunk);
        }
        start = end;
    }
    
    return chunks;
}

// --- Route TTS avec gestion des longs textes ---
app.post('/tts', async (req, res) => {
    try {
        const { text, gender = 'female' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Le champ "text" est requis.' });
        }

        const voice = gender === 'male' 
            ? 'en-US-GuyNeural'
            : 'en-US-JennyNeural';

        console.log(`📝 Texte original : ${text.length} caractères`);
        
        // --- Découpage intelligent ---
        const chunks = splitTextSmartly(text);
        console.log(`✂️ Découpé en ${chunks.length} bloc(s)`);
        
        // --- Génération audio bloc par bloc ---
        const audioBuffers = [];
        let chunkIndex = 0;
        
        for (const chunk of chunks) {
            chunkIndex++;
            console.log(`🎤 Génération du bloc ${chunkIndex}/${chunks.length} (${chunk.length} car.)`);
            
            const tts = new EdgeTTS(chunk, voice);
            const result = await tts.synthesize();
            
            // Convertir le Blob en Buffer
            let audioBuffer;
            if (result.audio instanceof Blob) {
                const arrayBuffer = await result.audio.arrayBuffer();
                audioBuffer = Buffer.from(arrayBuffer);
            } else if (Buffer.isBuffer(result.audio)) {
                audioBuffer = result.audio;
            } else {
                audioBuffer = Buffer.from(result.audio);
            }
            
            audioBuffers.push(audioBuffer);
            
            // Petite pause pour éviter de surcharger le service (optionnel)
            if (chunkIndex < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        // --- Fusion de tous les buffers audio ---
        const finalAudio = Buffer.concat(audioBuffers);
        console.log(`✅ Audio final généré : ${finalAudio.length} octets`);
        
        // --- Envoi du fichier MP3 complet ---
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', finalAudio.length);
        res.send(finalAudio);

    } catch (error) {
        console.error('❌ Erreur lors de la synthèse vocale:', error);
        res.status(500).json({ error: 'Erreur interne du serveur lors de la génération audio.' });
    }
});

// Route de test simple (GET) pour vérifier que le serveur tourne
app.get('/', (req, res) => {
    res.send('🎙️ API TTS gratuite avec découpage intelligent - Opérationnelle');
});

app.listen(PORT, () => {
    console.log(`🚀 API TTS démarrée sur http://localhost:${PORT}`);
});