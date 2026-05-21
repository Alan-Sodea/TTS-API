# 🎙️ API TTS Gratuite avec Découpage Intelligent

API REST légère qui transforme du texte en fichier audio MP3 grâce au moteur de synthèse vocale gratuit de Microsoft Edge.  
Elle gère automatiquement les textes longs en les découpant intelligemment (respect de la ponctuation) et en assemblant les blocs audio.

## ✨ Fonctionnalités

- **Synthèse vocale gratuite** – utilise `edge-tts-universal` (pas de clé API, pas de limite de requêtes imposée par ce serveur).
- **Découpage intelligent** – les textes dépassant 3000 caractères sont fractionnés en respectant les fins de phrase (`. ! ?`).
- **Choix de la voix** – voix féminine (`en-US-JennyNeural`) par défaut, ou masculine (`en-US-GuyNeural`) via paramètre.
- **Réponse MP3** – flux audio directement exploitable par un lecteur, un navigateur ou une application.
- **CORS activé** – prêt à être appelé depuis n’importe quel domaine.
- **Léger et simple** – un seul fichier, facile à déployer.

## 📋 Prérequis

- [Node.js](https://nodejs.org/) version 14 ou supérieure
- npm (installé avec Node.js)

## 🚀 Installation

1. **Cloner le dépôt** (ou copier les fichiers) :
   ```bash
   git clone https://github.com/Alan-Sodea/TTS-API
   cd tts-api
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```
   Les paquets utilisés sont `express`, `cors` et `edge-tts-universal`.

3. **Démarrer le serveur** :
   ```bash
   node server.js
   ```
   Par défaut, l’API écoute sur le port `3000`.  
   Vous devriez voir `🚀 API TTS démarrée sur http://localhost:3000`.

## 📡 Utilisation

### Endpoint unique

#### `POST /tts`

Transforme un texte en fichier audio MP3.

**Corps de la requête** (JSON) :

| Champ    | Type   | Obligatoire | Description                                                       |
|----------|--------|-------------|-------------------------------------------------------------------|
| `text`   | string | Oui         | Le texte à synthétiser.                                           |
| `gender` | string | Non          | `"female"` (par défaut) ou `"male"` pour choisir la voix.         |

**Réponse** :

- Succès : `200` avec le contenu audio (`Content-Type: audio/mpeg`).
- Erreur :
  - `400` si le champ `text` est absent.
  - `500` en cas d’erreur interne (problème de synthèse).

### Exemples

#### Avec cURL

Voix féminine par défaut :
```bash
curl -X POST http://localhost:3000/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Bonjour, ceci est un test de synthèse vocale."}' \
  --output test.mp3
```

Voix masculine :
```bash
curl -X POST http://localhost:3000/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test with a male voice.", "gender":"male"}' \
  --output test_male.mp3
```

#### Avec JavaScript (fetch)

```javascript
fetch('http://localhost:3000/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Texte long ou court...', gender: 'female' })
})
.then(response => response.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
});
```

#### Test rapide du serveur

```bash
curl http://localhost:3000/
# Réponse : 🎙️ API TTS gratuite avec découpage intelligent - Opérationnelle
```

## 🧠 Détail du découpage intelligent

Pour éviter de dépasser les limites du moteur TTS, les textes de plus de **3000 caractères** sont automatiquement découpés en blocs. La logique est la suivante :

1. Si le texte fait ≤ 3000 caractères, il est envoyé tel quel.
2. Sinon, on cherche dans la fenêtre des 3000 caractères la **dernière ponctuation forte** (`. ! ?` ou saut de ligne) située après la moitié de la taille du bloc (1500 car.).
3. Si aucune ponctuation n’est trouvée, on coupe au dernier espace.
4. Chaque bloc est synthétisé séparément, puis tous les buffers audio sont concaténés en un seul fichier MP3.
5. Une courte pause (200 ms) est observée entre les blocs pour ménager le service Edge TTS.

Ce mécanisme garantit des coupures naturelles sans mots hachés.

## ⚙️ Configuration

Vous pouvez modifier les paramètres directement dans le code (`server.js`) :

- **Port** : changez la constante `PORT` (ligne 7).
- **Taille maximale d’un bloc** : modifiez `MAX_CHARS_PER_CHUNK` (ligne 11). Valeur conseillée : entre 2000 et 5000 caractères. Une valeur trop élevée peut provoquer des erreurs du côté d’Edge TTS.
- **Voix** : les identifiants de voix sont en dur dans la route (lignes `'en-US-JennyNeural'` et `'en-US-GuyNeural'`). Vous pouvez les adapter à une autre langue/voix supportée par Edge TTS (ex. `'fr-FR-DeniseNeural'` pour le français).

## 🌍 Déploiement

L’application étant un simple serveur Express, vous pouvez la déployer facilement :

- Sur un VPS avec `node server.js` (éventuellement derrière un reverse proxy Nginx, ou avec `pm2` pour la gestion de processus).
- Sur des plateformes comme **Render**, **Railway** ou **Fly.io**.
- Pour un usage local uniquement, `localhost:3000` suffit.

**Attention** : L’API fait appel au service en ligne de Microsoft Edge TTS. Une connexion Internet est donc indispensable.

## 🧩 Dépendances

- [express](https://www.npmjs.com/package/express) – serveur web.
- [cors](https://www.npmjs.com/package/cors) – middleware CORS.
- [edge-tts-universal](https://www.npmjs.com/package/edge-tts-universal) – client pour la synthèse vocale Edge (compatible Node.js et navigateur).

## ❗ Limitations

- La synthèse repose sur un service externe gratuit (Microsoft Edge TTS). Sa disponibilité n’est pas garantie à 100 %.
- Le temps de réponse augmente avec la longueur du texte (enchaînement séquentiel des blocs).
- Pour l’instant, seules les voix anglaises sont configurées par défaut. Vous pouvez facilement en ajouter d’autres.
- Aucune gestion de file d’attente ou de cache n’est implémentée. Pour un usage en production, il est conseillé d’ajouter un reverse proxy et éventuellement un mécanisme de limitation de débit.

## 📄 Licence

Projet libre – vous pouvez l’utiliser, le modifier et le distribuer comme bon vous semble.  
Aucune garantie n’est fournie.

---

💡 *Idée d’amélioration : ajouter un paramètre `voice` pour choisir n’importe quelle voix Edge TTS, prendre en charge plusieurs langues, ou streamer l’audio au lieu d’attendre la fin de la synthèse.*
